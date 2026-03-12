// frontend/src/hooks/useFocusTrap.ts
// Focus trap hook for modal dialogs. XCUT-02.
// Keeps Tab/Shift+Tab cycling within the container when active.
import { useRef, useEffect } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Returns a ref to attach to the container element.
 * When isActive is true, Tab/Shift+Tab cycle stays inside the container
 * and focus moves to the first focusable element on activation.
 */
export function useFocusTrap(isActive: boolean): React.RefObject<HTMLDivElement | null> {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    // Focus the first focusable element when trap activates
    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    );
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const elements = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      );
      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if at first element, wrap to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: if at last element, wrap to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
}
