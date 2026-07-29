// Matcher extensions — runs AFTER the vitest framework is injected,
// so `expect` from 'vitest' is fully initialised here.
import '@testing-library/jest-dom/vitest';
import { expect } from 'vitest';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);
