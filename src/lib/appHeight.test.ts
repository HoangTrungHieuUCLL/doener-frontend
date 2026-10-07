import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyAppHeight, trackAppHeight } from './appHeight'

/** Just enough window/document for a module whose whole job is a side effect. */
function stubDom(innerHeight: number) {
  const props: Record<string, string> = {}
  const listeners: Record<string, Set<() => void>> = {}
  const win = {
    innerHeight,
    setTimeout: (fn: () => void) => fn(),
    addEventListener: (type: string, fn: () => void) => {
      ;(listeners[type] ??= new Set()).add(fn)
    },
    removeEventListener: (type: string, fn: () => void) => listeners[type]?.delete(fn),
  }
  vi.stubGlobal('window', win)
  vi.stubGlobal('document', {
    documentElement: { style: { setProperty: (k: string, v: string) => { props[k] = v } } },
  })
  return {
    props,
    win,
    fire: (type: string) => listeners[type]?.forEach((fn) => fn()),
    count: (type: string) => listeners[type]?.size ?? 0,
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('applyAppHeight', () => {
  it('writes the measured height, in px, over whatever the stylesheet guessed', () => {
    const dom = stubDom(852)
    applyAppHeight()
    expect(dom.props['--app-h']).toBe('852px')
  })
})

describe('trackAppHeight', () => {
  it('measures straight away, so the first render is already correct', () => {
    const dom = stubDom(844)
    trackAppHeight()
    expect(dom.props['--app-h']).toBe('844px')
  })

  it('follows the viewport when it changes', () => {
    const dom = stubDom(844)
    trackAppHeight()
    dom.win.innerHeight = 390
    dom.fire('resize')
    expect(dom.props['--app-h']).toBe('390px')
  })

  it('re-measures after a rotation, which iOS reports late', () => {
    const dom = stubDom(844)
    trackAppHeight()
    dom.win.innerHeight = 390
    dom.fire('orientationchange')
    expect(dom.props['--app-h']).toBe('390px')
  })

  it('unsubscribes cleanly, leaving no listener behind', () => {
    const dom = stubDom(844)
    const stop = trackAppHeight()
    expect(dom.count('resize') + dom.count('orientationchange')).toBe(2)
    stop()
    expect(dom.count('resize') + dom.count('orientationchange')).toBe(0)
  })
})
