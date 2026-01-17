import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a value
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 800ms)
 * @returns An object containing the debounced value and a boolean indicating if it's pending
 */
export function useDebounce<T>(value: T, delay: number = 800): { debouncedValue: T; isPending: boolean } {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    // Normalize string values for comparison (trim whitespace)
    const normalizedValue = typeof value === 'string' ? value.trim() : value;
    const normalizedDebounced = typeof debouncedValue === 'string' ? debouncedValue.trim() : debouncedValue;
    
    // Set pending state when value changes (after normalization)
    if (normalizedValue !== normalizedDebounced) {
      setIsPending(true);
    } else {
      // If they're the same after normalization, no need to wait
      setIsPending(false);
      return;
    }

    // Set up the timeout
    const timer = setTimeout(() => {
      setDebouncedValue(value);
      setIsPending(false);
    }, delay);

    // Cleanup function to cancel the timeout if value changes before delay
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return { debouncedValue, isPending };
}
