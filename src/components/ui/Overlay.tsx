import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

/** Full-screen scrim + dialog host for every modal in the app.
 *
 * Renders through a portal to `document.body` on purpose. `position: fixed`
 * resolves against the nearest ancestor with a transform, filter or
 * containment -- and the app shell's page-transition animation leaves a
 * transform on its wrapper permanently (`animation-fill-mode: both`). A
 * dialog rendered inside that wrapper is therefore positioned against the
 * whole scrolled page instead of the screen, which puts it, and its close
 * button, arbitrarily far out of view. The portal escapes that wrapper.
 *
 * Also freezes the content behind it, so a drag on the dialog cannot scroll
 * the page out from under it, and closes on Escape.
 */
export function Overlay({
  onClose,
  align = 'center',
  children,
}: {
  onClose: () => void
  /** Bottom sheet on phones, centered dialog otherwise. */
  align?: 'center' | 'bottom'
  children: ReactNode
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    // The app shell makes <main> the only scroller -- the page itself never
    // moves -- so that is what has to be frozen while a dialog is open.
    // Falls back to the body for any screen rendered outside the shell.
    const scroller: HTMLElement =
      document.querySelector('[data-app-scroller]') ?? document.body
    const previous = scroller.style.overflow
    scroller.style.overflow = 'hidden'
    return () => {
      scroller.style.overflow = previous
    }
  }, [])

  return createPortal(
    <div
      // `cursor-pointer` is not decoration: iOS Safari does not fire click
      // on a plain div, so without it tapping the scrim to dismiss silently
      // does nothing on an iPhone.
      // Height comes from --app-h, not inset-0: installed to the iOS home
      // screen, 100dvh/100svh fall short of the real screen (see index.css).
      className={`animate-overlay-in scrim fixed inset-x-0 top-0 z-50 h-[var(--app-h)] flex cursor-pointer justify-center p-4 ${
        align === 'bottom' ? 'items-end p-0 sm:items-center sm:p-4' : 'items-center'
      }`}
      onClick={onClose}
    >
      {children}
    </div>,
    document.body,
  )
}
