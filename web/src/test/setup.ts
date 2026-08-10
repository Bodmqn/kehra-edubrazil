import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(cleanup)

// jsdom does not implement pointer capture APIs; stub them for drag tests
if (typeof Element !== 'undefined' && !Element.prototype.setPointerCapture) {
  const noop = (): void => {}
  Element.prototype.setPointerCapture = noop
  Element.prototype.releasePointerCapture = noop
  Element.prototype.hasPointerCapture = (): boolean => false
}
