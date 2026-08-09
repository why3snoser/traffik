/**
 * Refcounted body scroll lock, shared by every overlay in the app.
 *
 * Refcounted because overlays nest — a photo lightbox can open over an already
 * open bottom sheet. If each one restored the body on unmount, closing the inner
 * overlay would unlock the page while the outer one is still up. Only the last
 * release puts the page back, and only it restores the scroll position.
 *
 * `position: fixed` on <body> rather than `overflow: hidden`: iOS Safari ignores
 * `overflow: hidden` on the body and keeps rubber-banding the page behind the
 * overlay. Pinning it costs us the scroll offset, which is why it is saved and
 * re-applied on release.
 *
 * There must be exactly one of these in the app. A second mechanism setting
 * `document.body.style.overflow` directly would fight this counter.
 */
let lockCount = 0
let savedScrollY = 0

export function lockBodyScroll() {
  if (lockCount++ > 0) return
  savedScrollY = window.scrollY
  const { style } = document.body
  style.position = 'fixed'
  style.top = `-${savedScrollY}px`
  style.left = '0'
  style.right = '0'
  style.width = '100%'
}

export function unlockBodyScroll() {
  if (--lockCount > 0) return
  lockCount = 0
  const { style } = document.body
  style.position = ''
  style.top = ''
  style.left = ''
  style.right = ''
  style.width = ''
  window.scrollTo(0, savedScrollY)
}
