import { useState, useCallback, useRef, useEffect } from 'react';

const STORAGE_KEY = 'sidebar-width';
const MIN_WIDTH = 200;
const MAX_WIDTH = 500;
const DEFAULT_WIDTH = 192;

function getInitialWidth(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
        return parsed;
      }
    }
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_WIDTH;
}

export function useResizableSidebar() {
  const [width, setWidth] = useState(getInitialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const isResizingRef = useRef(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const clamped = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
    setWidth(clamped);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    const clamped = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, touch.clientX));
    setWidth(clamped);
  }, []);

  const handleMouseUp = useCallback(() => {
    isResizingRef.current = false;
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleTouchEnd = useCallback(() => {
    isResizingRef.current = false;
    setIsResizing(false);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  }, [handleTouchMove]);

  // Persist width to localStorage when resizing ends
  useEffect(() => {
    if (!isResizing) {
      try {
        localStorage.setItem(STORAGE_KEY, String(width));
      } catch {
        // localStorage unavailable
      }
    }
  }, [isResizing, width]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    setIsResizing(true);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  }, [handleTouchMove, handleTouchEnd]);

  return { width, onMouseDown, onTouchStart, isResizing };
}
