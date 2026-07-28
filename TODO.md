# PDF/UA Investor Statement - Implementation TODO

## Steps

### Phase 1: Core PDF/UA Components ✅
- [x] 1. Create `src/components/InvestorStatement/index.ts` - barrel export
- [x] 2. Create `src/components/InvestorStatement/usePrintStatement.ts` - custom hook for print dialog management
- [x] 3. Create `src/components/InvestorStatement/InvestorStatement.tsx` - main PDF/UA compliant component with semantic HTML, proper heading hierarchy, ARIA attributes, and tagged reading order
- [x] 4. Create `src/components/InvestorStatement/InvestorStatement.css` - print-specific and @media print styles for PDF/UA

### Phase 2: Integration ✅
- [x] 5. Update `src/pages/InvestorPortfolioSummary.tsx` - add "Print Investor Statement" button and integrate statement overlay
- [x] 6. Add global print hide styles for page chrome/navigation

### Phase 3: Testing
- [x] 7. Create `src/components/InvestorStatement/InvestorStatement.test.tsx` - tests for accessibility, semantics, and rendering
- [ ] 8. Update `vite.config.ts` - add coverage thresholds for new components

### Phase 4: Verification
- [ ] 9. Run linting and fix any issues
- [ ] 10. Run tests to ensure all pass
- [ ] 11. Build project to verify compilation

