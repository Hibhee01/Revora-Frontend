# Pull Request Description

## Issue
Closes #[UI/UX Design] Design a Transaction Receipt share-as-image affordance

## Summary
Introduces a new `TransactionReceiptShare` component that generates a compact, shareable receipt image from transaction details. This provides users a robust affordance for sharing transaction receipts via chat or social media platforms.

## Key Changes
- Created `TransactionReceiptShare` component to render transaction details securely.
- Configured component with Issuer branding (logo, name, and verified badge).
- Added a "Hide Amount" toggle to allow users privacy when sharing their receipt.
- Leveraged `html2canvas` for precise, reliable image generation.
- Provided "Copy Image" and "Download Image" functionality for easy sharing, including clipboard fallbacks for incompatible browsers.
- Disabled selection (`user-select: none`) on sensitive fields like sender and recipient wallets to reduce risk of unintended data leakage.
- Enforced WCAG 2.1 AA accessibility standards and keyboard navigation for all interactive buttons.
- Ensured responsive design across all viewports for the receipt affordances.

## Testing
- Automated Unit Tests: Maintained >95% coverage for the `TransactionReceiptShare` component testing UI toggles and canvas actions.
- Accessibility Verification: Component tests verified zero violations with `jest-axe`.

## Screenshots
_Screenshots to be added showing the expanded and hidden-amount variants._
