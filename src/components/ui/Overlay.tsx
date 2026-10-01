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
 * Also locks the page behind it, so a drag on the dialog cannot scroll the
 * page out from under it, and closes on Escape.
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
    // Pinning the body is the one scroll lock iOS Safari actually honours;
    // `overflow: hidden` alone does not stop it. The offset keeps the page
    // from jumping to the top while the dialog is open.
    const scrollY = window.scrollY
    const { style } = document.body
    const previous = {
      position: style.position,
      top: style.top,
      width: style.width,
      overflow: style.overflow,
    }
    style.position = 'fixed'
    style.top = `-${scrollY}px`
    style.width = '100%'
    style.overflow = 'hidden'
    return () => {
      style.position = previous.position
      style.top = previous.top
      style.width = previous.width
      style.overflow = previous.overflow
      window.scrollTo(0, scrollY)
    }
  }, [])

  return createPortal(
    <div
      // `cursor-pointer` is not decoration: iOS Safari does not fire click
      // on a plain div, so without it tapping the scrim to dismiss silently
      // does nothing on an iPhone.
      className={`animate-overlay-in scrim fixed inset-0 z-50 flex cursor-pointer justify-center p-4 ${
        align === 'bottom' ? 'items-end p-0 sm:items-center sm:p-4' : 'items-center'
      }`}
      onClick={onClose}
    >
      {children}
    </div>,
    document.body,
  )
}
