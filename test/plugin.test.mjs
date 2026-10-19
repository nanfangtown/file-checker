import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import vm from 'node:vm'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** A minimal React surface: enough to assert the rendered action without a browser. */
const React = {
  createElement(type, props, ...children) {
    return { type, props: props ?? {}, children }
  },
  useState(initial) {
    return [typeof initial === 'function' ? initial() : initial, () => {}]
  },
  useEffect() {},
  useRef(value) {
    return { current: value }
  },
}

/**
 * Load the browser artifact the way the DSH module loader does and return the
 * captured entry plus the document stub used by the style effect.
 *
 * @param options - optional existing style element for the idempotency test.
 */
function loadClient(options = {}) {
  let entry
  const styles = []
  const document = {
    querySelector: () => options.existingStyle ?? null,
    createElement: () => ({
      dataset: {},
      textContent: '',
      removed: false,
      remove() {
        this.removed = true
      },
    }),
    head: {
      appendChild(tag) {
        styles.push(tag)
      },
    },
  }
  const window = {
    __ModuleLoader__: {
      load(value) {
        entry = value
      },
    },
  }
  const sandbox = {
    window,
    document,
    clearTimeout() {},
    setTimeout() {
      return 1
    },
  }
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'client.js'), 'utf8'), sandbox, {
    filename: 'client.js',
  })
  assert.ok(entry, 'client.js must register a module entry')
  const plugin = entry.factory((name) => {
    if (name === 'react') return React
    throw new Error(`unexpected require: ${name}`)
  })
  return { entry, plugin, document, styles }
}

/** A context that records effects, dictionaries, and slot registrations. */
function createContext() {
  const effects = []
  const locales = []
  const slots = []
  const injected = []
  const ctx = {
    effect(fn, label) {
      const cleanup = fn()
      effects.push({ label, cleanup })
      return () => cleanup?.()
    },
    locale: {
      register(ns, dictionaries) {
        locales.push({ ns, dictionaries })
        return () => {}
      },
    },
    slots: {
      inject(owner, callback) {
        injected.push(owner)
        callback()
      },
      register(options, component) {
        slots.push({ options, component })
        return () => {}
      },
    },
  }
  return { ctx, effects, locales, slots, injected }
}

/**
 * Expand one `package.json` `files` pattern against the checkout.
 *
 * @param pattern - a literal path or a single `*` glob such as `locale/*.json`.
 * @returns the files that would ship, or an empty list when nothing matches.
 */
function expandFilePattern(pattern) {
  const star = pattern.indexOf('*')
  if (star === -1) {
    return fs.existsSync(path.join(ROOT, pattern)) ? [pattern] : []
  }
  const directory = path.dirname(pattern)
  const base = path.basename(pattern)
  const expression = new RegExp(
    '^' + base.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'
  )
  const absoluteDirectory = path.join(ROOT, directory)
  if (!fs.existsSync(absoluteDirectory)) return []
  return fs
    .readdirSync(absoluteDirectory)
    .filter((name) => expression.test(name))
    .map((name) => path.join(directory, name))
}

test('manifest, package metadata, and bundle patch are valid', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
  assert.equal(manifest.name, 'filechecker')
  assert.equal(manifest.version, '1.0.0')
  assert.equal(manifest.private, undefined)
  assert.equal(manifest.license, 'MIT')
  assert.equal(manifest.author, 'nanfangtown')
  assert.match(manifest.repository.url, /github\.com\/nanfangtown\/file-checker/)
  assert.match(manifest.homepage, /nanfangtown\/file-checker#readme/)
  assert.equal(manifest.publishConfig.access, 'public')
  assert.equal(manifest.engines.node, '>=22.15.0')
  assert.match(manifest.engines.dsh, /^>=0\.2\.1-rc\.2 <0\.3\.0-0$/)
  assert.equal(manifest.scripts.test, 'node --test')
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(manifest.dsh.client.platform, 'web')
  assert.equal(manifest.dsh.client.immediately, true)
  assert.ok(manifest.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-deliverables'))
  assert.ok(manifest.exports['.'])
  assert.ok(manifest.exports['./client'])
  assert.ok(manifest.exports['./icon'])
  assert.ok(manifest.exports['./locale/*.json'])
  assert.ok(manifest.files.includes('client.js'))
  assert.ok(manifest.files.includes('docs/delivery-card.svg'))

  for (const pattern of manifest.files) {
    assert.ok(
      expandFilePattern(pattern).length > 0,
      `shipped file pattern matched nothing: ${pattern}`
    )
  }

  const patch = fs.readFileSync(path.join(ROOT, 'cordis.patch.yml'), 'utf8')
  assert.match(patch, /id:\s*filechecker/)
  assert.match(patch, /name:\s*filechecker/)

  const illustration = fs.readFileSync(path.join(ROOT, 'docs', 'delivery-card.svg'), 'utf8')
  assert.match(illustration, /^<svg[\s>]/)
  assert.match(illustration, /<\/svg>\s*$/)
  assert.doesNotMatch(illustration, /<script[\s>]/i)
})

test('host half exports the empty apply form', async () => {
  const host = await import(pathToFileURL(path.join(ROOT, 'index.js')).href)
  assert.equal(typeof host.apply, 'function')
  assert.equal(host.apply(), undefined)
})

test('client installs one localized action into the delivery-card slot', () => {
  const { entry, plugin } = loadClient()
  const { ctx, effects, locales, slots, injected } = createContext()

  assert.equal(entry.id, 'filechecker')
  assert.deepEqual(Array.from(plugin.inject), ['slots', 'locale'])
  plugin.apply(ctx)

  assert.deepEqual(injected, ['deliverables.file.actions'])
  assert.equal(slots.length, 1)
  assert.equal(slots[0].options.name, 'deliverables.file.actions')
  assert.equal(slots[0].options.id, 'filechecker')
  assert.equal(slots[0].options.locale, 'filechecker')

  assert.equal(locales.length, 1)
  assert.equal(locales[0].ns, 'filechecker')
  const zhKeys = Object.keys(locales[0].dictionaries.zh).sort()
  const enKeys = Object.keys(locales[0].dictionaries.en).sort()
  assert.deepEqual(enKeys, zhKeys, 'both dictionaries must expose the same keys')

  const style = effects.find((effect) => effect.label === 'filechecker: action styles')
  assert.ok(style, 'the action styles must be registered as an effect')
  assert.ok(effects.some((effect) => effect.label === 'filechecker: dictionaries'))
})

test('the action hides without a native desktop and renders a labelled button with one', () => {
  const { plugin } = loadClient()
  const { ctx, slots } = createContext()
  plugin.apply(ctx)
  const Action = slots[0].component
  const t = (key) => key

  assert.equal(Action({ available: false, pending: false, t, onAction: async () => null }), null)
  assert.equal(Action({ t, onAction: async () => null }), null)

  const idle = Action({ available: true, pending: false, t, onAction: async () => null })
  assert.equal(idle.type, 'button')
  assert.equal(idle.props.type, 'button')
  assert.equal(idle.props.className, 'filechecker-reveal')
  assert.equal(idle.props['aria-label'], 'action.reveal')
  assert.equal(idle.props.title, 'action.revealHint')
  assert.equal(idle.props['data-status'], 'idle')
  assert.equal(idle.props.disabled, false)

  const busy = Action({ available: true, pending: true, t, onAction: async () => null })
  assert.equal(busy.props.disabled, true)
  assert.equal(busy.props['aria-label'], 'action.revealing')
  assert.equal(busy.props['data-pending'], 'true')
})

test('the action asks the card owner for the authenticated reveal gesture', async () => {
  const { plugin } = loadClient()
  const { ctx, slots } = createContext()
  plugin.apply(ctx)
  const Action = slots[0].component
  const calls = []
  const action = Action({
    available: true,
    pending: false,
    t: (key) => key,
    onAction: async (gesture) => {
      calls.push(gesture)
      return null
    },
  })
  const event = { prevented: false, stopped: false }
  await action.props.onClick({
    preventDefault() {
      event.prevented = true
    },
    stopPropagation() {
      event.stopped = true
    },
  })
  assert.deepEqual(calls, ['reveal'])
  assert.equal(event.prevented, true)
  assert.equal(event.stopped, true)
})

test('the style effect removes its own tag on dispose', () => {
  const { plugin, styles } = loadClient()
  const { ctx, effects } = createContext()
  plugin.apply(ctx)
  const style = effects.find((effect) => effect.label === 'filechecker: action styles')
  assert.equal(styles.length, 1)
  assert.match(styles[0].textContent, /\.filechecker-reveal/)
  assert.equal(styles[0].dataset.plugin, 'filechecker')
  style.cleanup()
  assert.equal(styles[0].removed, true)
})

test('an existing action style is reused and not removed', () => {
  const existing = {
    dataset: { plugin: 'filechecker', pluginCss: 'filechecker/action.css' },
    textContent: '',
    removed: false,
    remove() {
      this.removed = true
    },
  }
  const { plugin, styles } = loadClient({ existingStyle: existing })
  const { ctx, effects } = createContext()
  plugin.apply(ctx)
  const style = effects.find((effect) => effect.label === 'filechecker: action styles')
  assert.equal(styles.length, 0)
  assert.equal(style.cleanup, undefined)
  assert.equal(existing.removed, false)
})

test('locale metadata files describe the plugin in both languages', () => {
  for (const locale of ['zh', 'en']) {
    const value = JSON.parse(fs.readFileSync(path.join(ROOT, 'locale', `${locale}.json`), 'utf8'))
    assert.equal(typeof value.meta.title, 'string')
    assert.ok(value.meta.title.length > 0)
    assert.equal(typeof value.meta.description, 'string')
    assert.ok(value.meta.description.length > 0)
  }
  const icon = fs.readFileSync(path.join(ROOT, 'icon.svg'), 'utf8')
  assert.match(icon, /<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)
})
