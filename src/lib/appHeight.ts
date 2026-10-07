/**
 * Pins `--app-h` to the height the user can actually see, in pixels.
 *
 * Installed to the iOS home screen (viewport-fit=cover + a black-translucent
 * status bar), Safari's viewport units disagree with each other and with the
 * screen. 100dvh, 100svh and 100% all come up short by the status bar, which
 * leaves the app floating above the bottom edge; 100lvh overshoots by the same
 * amount, which pushes the set logger's panel off the bottom of the screen --
 * roughly 59px of overshoot against a 42px bottom gap, so the panel's lower
 * edge lands below the glass. In a Safari tab both units agree and neither
 * problem shows, which is why this only ever went wrong on the home screen.
 *
 * window.innerHeight is the one number that matches the visible area in every
 * mode, so it wins over the CSS. The stylesheet keeps 100dvh as the pre-script
 * fallback: if it is wrong it is wrong short, and a little background showing
 * through beats content falling off the screen.
 *
 * innerHeight, not visualViewport.height: the latter shrinks when the software
 * keyboard opens, which would collapse the whole layout under every text field.
 */
export function applyAppHeight(): void {
  document.documentElement.style.setProperty('--app-h', `${window.innerHeight}px`)
}

/** Keeps {@link applyAppHeight} current. Returns an unsubscribe function. */
export function trackAppHeight(): () => void {
  applyAppHeight()
  // iOS reports the old height during the rotation itself, so re-measure once
  // the new one has settled as well as on the event.
  const settle = () => {
    applyAppHeight()
    window.setTimeout(applyAppHeight, 250)
  }
  window.addEventListener('resize', applyAppHeight)
  window.addEventListener('orientationchange', settle)
  return () => {
    window.removeEventListener('resize', applyAppHeight)
    window.removeEventListener('orientationchange', settle)
  }
}
