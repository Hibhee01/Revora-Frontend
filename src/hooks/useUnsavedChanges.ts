import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * A hook that prevents the user from accidentally leaving a page with unsaved changes.
 * 
 * - Handles browser refresh/close via beforeunload event.
 * - Handles React Router navigation via useBlocker.
 * 
 * @param isDirty Whether the form/page has unsaved changes.
 * @returns A blocker object from react-router-dom, which can be used to show a custom modal.
 */
export function useUnsavedChanges(isDirty: boolean) {
  // Handle browser refresh/close
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      // Included for legacy support, e.g., Chrome/Edge
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // Handle SPA navigation
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  return blocker;
}
