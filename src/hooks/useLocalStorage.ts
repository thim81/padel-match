import { useState, useCallback, useEffect } from 'react';

const LOCAL_STORAGE_EVENT = 'local-storage';

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
      window.dispatchEvent(
        new CustomEvent(LOCAL_STORAGE_EVENT, {
          detail: { key, value: valueToStore },
        }),
      );
    },
    [key, initialValue]
  );

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== key) return;
      try {
        const parsed = event.newValue ? JSON.parse(event.newValue) : initialValue;
        setStoredValue(parsed);
      } catch {
        setStoredValue(initialValue);
      }
    };

    const handleLocalStorageEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ key: string; value: T }>;
      if (customEvent.detail?.key !== key) return;
      setStoredValue(customEvent.detail.value);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(LOCAL_STORAGE_EVENT, handleLocalStorageEvent);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(LOCAL_STORAGE_EVENT, handleLocalStorageEvent);
    };
  }, [key]);

  return [storedValue, setValue] as const;
}
