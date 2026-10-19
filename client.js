/*! FileChecker — MIT License — https://github.com/nanfangtown/file-checker */
/**
 * FileChecker — browser half.
 *
 * Adds one direct, labelled “打开位置” action to every delivered-file card.
 * The action calls the card owner's `onAction('reveal')`, i.e. the same
 * authenticated `/api/present.open?action=reveal` gesture the built-in menu
 * uses. No file path is copied to the page and no DOM outside this component
 * is inspected.
 */
window.__ModuleLoader__.load({
  id: 'filechecker',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    /** Dictionary namespace owned by this plugin. */
    const NS = 'filechecker'

    /** Simplified Chinese dictionary (the key-set source of truth). */
    const zh = {
      'action.reveal': '打开位置',
      'action.revealHint': '在文件管理器中显示这个文件',
      'action.revealing': '打开中…',
      'action.revealed': '已定位',
      'action.failed': '打开失败',
      'action.failedHint': '无法打开文件位置，请稍后重试',
    }

    /** English dictionary; keep exactly the same keys as `zh`. */
    const en = {
      'action.reveal': 'Open location',
      'action.revealHint': 'Show this file in the system file manager',
      'action.revealing': 'Opening…',
      'action.revealed': 'Located',
      'action.failed': 'Failed',
      'action.failedHint': 'Could not show the file location. Try again.',
    }

    const STYLE_ID = 'filechecker/action.css'

    const CSS = [
      '.filechecker-reveal{',
      'box-sizing:border-box;display:inline-flex;align-items:center;gap:4px;',
      'height:24px;padding:0 8px;margin-left:2px;border:.5px solid var(--dsw-alias-border-l1);',
      'border-radius:var(--dsw-radius-sm,6px);background:transparent;',
      'color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:18px;',
      'white-space:nowrap;cursor:pointer;flex:none;',
      'transition:background-color .12s,color .12s,border-color .12s;',
      '}',
      '.filechecker-reveal:hover:not(:disabled){',
      'background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);',
      '}',
      '.filechecker-reveal:focus-visible{',
      'outline:none;box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));',
      '}',
      '.filechecker-reveal:disabled{cursor:progress;opacity:.72}',
      '.filechecker-reveal[data-status="error"]{',
      'color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary);',
      '}',
      '.filechecker-reveal[data-status="success"]{',
      'color:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-state-success-primary);',
      '}',
      '.filechecker-reveal svg{display:block;flex:none;width:14px;height:14px}',
      '.filechecker-reveal[data-pending="true"] svg{animation:filechecker-spin .8s linear infinite}',
      '@keyframes filechecker-spin{to{transform:rotate(1turn)}}',
      '@media (prefers-reduced-motion:reduce){',
      '.filechecker-reveal[data-pending="true"] svg{animation:none}',
      '}',
    ].join('')

    /** A folder outline; the label carries the meaning, so the glyph stays quiet. */
    function FolderIcon() {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          'aria-hidden': true,
          focusable: 'false',
        },
        h('path', {
          d: 'M1.75 4.4c0-.6.49-1.1 1.1-1.1h3.06c.3 0 .58.12.79.33l1.15 1.17h5.3c.6 0 1.1.49 1.1 1.1v5.7c0 .6-.49 1.1-1.1 1.1H2.85c-.6 0-1.1-.49-1.1-1.1z',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': '1.5',
          'stroke-linejoin': 'round',
        })
      )
    }

    /** A check drawn at the same weight as the folder. */
    function CheckIcon() {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          'aria-hidden': true,
          focusable: 'false',
        },
        h('path', {
          d: 'M3.25 8.4l3.05 3.05 6.45-7.1',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': '1.7',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        })
      )
    }

    /** A compact warning glyph for a failed reveal. */
    function AlertIcon() {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          'aria-hidden': true,
          focusable: 'false',
        },
        h('circle', {
          cx: 8,
          cy: 8,
          r: 5.9,
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': '1.5',
        }),
        h('path', {
          d: 'M8 4.9v3.9M8 11.2v.1',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': '1.7',
          'stroke-linecap': 'round',
        })
      )
    }

    /** A broken ring used as the pending spinner. */
    function SpinnerIcon() {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          'aria-hidden': true,
          focusable: 'false',
        },
        h('circle', {
          cx: 8,
          cy: 8,
          r: 5.5,
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': '1.6',
          'stroke-linecap': 'round',
          'stroke-dasharray': '20 14',
        })
      )
    }

    /**
     * Render one direct reveal action on a delivered-file card.
     *
     * Slot props supplied by `ui-deliverables`:
     * - `available`: the Host desktop can hand paths to native applications;
     * - `pending`: a native open/reveal for this card is already running;
     * - `onAction(action)`: runs the authenticated gesture and returns a
     *   failure kind (`'revealError'`) or `null` on success.
     *
     * @param props slot props plus the bound dictionary function `t`.
     * @returns the action, or null when the Host has no usable desktop.
     */
    function RevealAction(props) {
      const t = typeof props.t === 'function' ? props.t : (key) => key
      const alive = React.useRef(true)
      const timer = React.useRef(null)
      const [status, setStatus] = React.useState('idle')

      React.useEffect(() => {
        alive.current = true
        return () => {
          alive.current = false
          if (timer.current !== null) clearTimeout(timer.current)
        }
      }, [])

      if (props.available !== true) return null

      const pending = props.pending === true
      const busy = pending || status === 'busy'
      const label = busy
        ? t('action.revealing')
        : status === 'success'
          ? t('action.revealed')
          : status === 'error'
            ? t('action.failed')
            : t('action.reveal')
      const title = status === 'error' ? t('action.failedHint') : t('action.revealHint')

      const settle = (next, delay) => {
        if (!alive.current) return
        setStatus(next)
        if (timer.current !== null) clearTimeout(timer.current)
        timer.current = setTimeout(() => {
          timer.current = null
          if (alive.current) setStatus('idle')
        }, delay)
      }

      const onClick = async (event) => {
        event.preventDefault()
        event.stopPropagation()
        if (busy) return
        if (typeof props.onAction !== 'function') {
          settle('error', 5000)
          return
        }
        setStatus('busy')
        let result
        try {
          result = await props.onAction('reveal')
        } catch (_error) {
          result = 'revealError'
        }
        if (result === null || result === undefined) settle('success', 2000)
        else settle('error', 5000)
      }

      const icon = busy
        ? h(SpinnerIcon)
        : status === 'success'
          ? h(CheckIcon)
          : status === 'error'
            ? h(AlertIcon)
            : h(FolderIcon)

      return h(
        'button',
        {
          type: 'button',
          className: 'filechecker-reveal',
          onClick,
          disabled: busy,
          title,
          'aria-label': label,
          'data-status': status,
          'data-pending': busy ? 'true' : undefined,
          'data-filechecker-reveal': true,
        },
        icon,
        h('span', { 'aria-hidden': true }, label)
      )
    }

    /** Client plugin body: one dictionary effect, one style effect, one slot entry. */
    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'filechecker: dictionaries')

      ctx.effect(() => {
        if (typeof document === 'undefined') return undefined
        const existing = document.querySelector('style[data-plugin-css="' + STYLE_ID + '"]')
        if (existing !== null) return undefined
        const tag = document.createElement('style')
        tag.dataset.plugin = 'filechecker'
        tag.dataset.pluginCss = STYLE_ID
        tag.textContent = CSS
        document.head.appendChild(tag)
        return () => {
          tag.remove()
        }
      }, 'filechecker: action styles')

      ctx.slots.inject('deliverables.file.actions', () =>
        ctx.slots.register(
          {
            name: 'deliverables.file.actions',
            id: 'filechecker',
            order: 20,
            locale: NS,
          },
          RevealAction
        )
      )
    }

    return { inject: ['slots', 'locale'], apply }
  },
})
