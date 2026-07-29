// Browser API stubs — runs before the vitest framework is injected.
// Do NOT import anything from 'vitest' here.
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { expect } from 'vitest';

expect.extend(toHaveNoViolations);

// ResizeObserver stub — jsdom does not implement it.
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// jsdom does not implement scrollIntoView — provide a minimal stub
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function () {};
}
