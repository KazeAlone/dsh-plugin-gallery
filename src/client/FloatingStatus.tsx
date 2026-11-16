import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { AgentTeamsTranslate } from './locales.ts'
import css from './ActivityPanel.module.css'

/** Keep the shortcut within its host surface, including after restoring or resizing. */
export function FloatingStatus({ children, t, title }: { children: ReactNode; t: AgentTeamsTranslate; title: string }) {
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const [minimized, setMinimized] = useState(false)
  const [position, setPosition] = useState({ right: 18, top: 64 })
  const drag = useRef<{ id: number; x: number; y: number; right: number; top: number } | null>(null)
  const moved = useRef(false)
  const clamp = (right: number, top: number) => {
    const element = root.current
    const parent = element?.offsetParent
    if (!element || !parent) return { right, top }
    return { right: Math.max(0, Math.min(right, parent.clientWidth - element.offsetWidth)), top: Math.max(0, Math.min(top, parent.clientHeight - element.offsetHeight)) }
  }
  useLayoutEffect(() => {
    const fit = () => setPosition(old => {
      const next = clamp(old.right, old.top)
      return next.right === old.right && next.top === old.top ? old : next
    })
    fit()
    const observer = new ResizeObserver(fit)
    if (root.current) observer.observe(root.current)
    if (root.current?.offsetParent) observer.observe(root.current.offsetParent)
    return () => observer.disconnect()
  }, [])
  const toggle = () => { setMinimized(value => !value); button.current?.focus() }
  return <div ref={root} className={css.floatingStatus} style={position} data-minimized={minimized}
    onPointerDown={event => {
      if (event.button !== 0 || !event.isPrimary) return
      moved.current = false
      drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, ...position }
    }}
    onPointerMove={event => {
      const start = drag.current
      if (!start || start.id !== event.pointerId) return
      const dx = event.clientX - start.x, dy = event.clientY - start.y
      if (!moved.current && Math.hypot(dx, dy) < 5) return
      moved.current = true
      event.currentTarget.setPointerCapture(event.pointerId)
      setPosition(clamp(start.right - dx, start.top + dy))
    }}
    onPointerUp={event => {
      drag.current = null
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    }}
    onPointerLeave={() => { if (!moved.current) drag.current = null }}
    onPointerCancel={() => { drag.current = null }}
    onLostPointerCapture={() => { drag.current = null }}
    onClickCapture={event => {
      if (moved.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); moved.current = false }
    }}>
    <div hidden={minimized}>{children}</div>
    <button ref={button} type="button" className={css.statusToggle} onClick={toggle}
      aria-label={t(minimized ? 'activity.restore' : 'activity.minimize')}
      title={minimized ? `${t('activity.restore')} · ${title}` : t('activity.minimize')} aria-expanded={!minimized}>
      <span aria-hidden>{minimized ? '●' : '−'}</span>
    </button>
  </div>
}
