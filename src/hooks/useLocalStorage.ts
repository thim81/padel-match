import { useState, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      // Read current value directly from localStorage (source of truth)
      // to avoid React 18 batching issues where setState updater runs deferred
      let current: T;
      try {
        const item = window.localStorage.getItem(key);
        current = item ? JSON.parse(item) : initialValue;
      } catch {
        current = initialValue;
      }

      const valueToStore = value instanceof Function ? value(current) : value;
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      setStoredValue(valueToStore);
    },
    [key, initialValue]
  );

  return [storedValue, setValue] as const;
}
