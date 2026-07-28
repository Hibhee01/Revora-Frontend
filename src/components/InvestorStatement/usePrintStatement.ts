/**
 * usePrintStatement — PDF/UA Investor Statement print hook
 *
 * Manages a full-page statement overlay that is rendered when the user
 * triggers "Print Investor Statement". Uses the native browser print
 * dialog, which preserves HTML semantics (headings, tables, lists, lang)
 * for PDF/UA compliance when "Save as PDF" is selected.
 *
 * Returns:
 *  - showStatement: boolean — whether to render the statement overlay
 *  - isPrinting: boolean   — true when the print dialog is open
 *  - printStatement: () => void — call to trigger print flow
 *  - cancelStatement: () => void — call to dismiss without printing
 */

import { useState, useCallback, useEffect } from "react";

export function usePrintStatement() {
  const [showStatement, setShowStatement] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Fallback: detect print via media query (safari / older browsers)
  useEffect(() => {
    if (!showStatement) return;

    const handleBefore = () => setIsPrinting(true);
    const handleAfter = () => {
      setIsPrinting(false);
      // Auto-dismiss statement overlay after print completes
      setShowStatement(false);
    };

    window.addEventListener("beforeprint", handleBefore);
    window.addEventListener("afterprint", handleAfter);

    const mql = window.matchMedia("print");
    const handleMql = (e: MediaQueryListEvent | MediaQueryList) => {
      if ("matches" in e) {
        setIsPrinting(e.matches);
        if (!e.matches) {
          setShowStatement(false);
        }
      }
    };
    if (mql.addEventListener) {
      mql.addEventListener("change", handleMql);
    }

    return () => {
      window.removeEventListener("beforeprint", handleBefore);
      window.removeEventListener("afterprint", handleAfter);
      if (mql.removeEventListener) {
        mql.removeEventListener("change", handleMql);
      }
    };
  }, [showStatement]);

  const printStatement = useCallback(() => {
    setShowStatement(true);
    // Wait for render, then open print dialog
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
      }, 100);
    });
  }, []);

  const cancelStatement = useCallback(() => {
    setShowStatement(false);
    setIsPrinting(false);
  }, []);

  return { showStatement, isPrinting, printStatement, cancelStatement };
}

