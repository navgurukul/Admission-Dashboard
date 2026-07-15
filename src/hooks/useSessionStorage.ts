import { useState, useEffect } from "react";

export function useSessionStorage<T>(key: string, initialValue: T | (() => T)) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = sessionStorage.getItem(key);
      if (item !== null) {
        try {
          return JSON.parse(item);
        } catch {
          // Fallback for plain strings
          if (typeof initialValue === "string" || typeof initialValue === "function") {
            return item as unknown as T;
          }
        }
      }
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
    }
    
    if (typeof initialValue === "function") {
      return (initialValue as () => T)();
    }
    return initialValue;
  });

  useEffect(() => {
    try {
      if (value === undefined) {
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
      }
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue] as const;
}
