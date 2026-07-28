# Save-as-Draft Affordance

## Pattern Overview

The **Save-as-Draft** affordance is designed to help founders interacting with long, multi-step data collection wizards (such as the Offering Registration wizard). It provides a mechanism to persist partial progress without committing the form, allowing users to safely resume later.

## Requirements & Implementation Details

- **Positioning**: Bound to the wizard footer, anchored alongside primary actions (e.g. Next / Back / Submit).
- **Feedback**: Provides visible timestamps for the last successful save and inline toast messaging explicitly tied to the interaction region to keep the context local.
- **Offline / Failure Recovery**: Includes an explicit "Retry" action if the draft fails to save (e.g. offline scenario) along with focus management to move the screen reader focus to the error message.
- **Accessibility**: Meets WCAG 2.1 AA standards. Error states shift focus, success states use `aria-live="polite"` and `aria-atomic="true"`. Buttons include appropriate `aria-label`s.

## Usage

```tsx
import { SaveAsDraft } from '../components/designSystem/SaveAsDraft';

<div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-700">
  <SaveAsDraft onSave={async () => {
    // Implement API call to persist draft
  }} />
  <div className="flex gap-3">
    <Button variant="secondary">Back</Button>
    <Button variant="primary">Next</Button>
  </div>
</div>
```
