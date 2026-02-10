import { useState, useCallback, useEffect, useRef } from 'react';

const LOCAL_STORAGE_EVENT = 'local-storage';

function readLocalStorageValue<T>(key: string, fallback: T): T {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const initialValueRef = useRef(initialValue);
  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  const [storedValue, setStoredValue] = useState<T>(() =>
    readLocalStorageValue(key, initialValueRef.current)
  );

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      // Read current value directly from localStorage (source of truth)
      // to avoid React 18 batching issues where setState updater runs deferred
      const current = readLocalStorageValue(key, initialValueRef.current);

      const valueToStore = value instanceof Function ? value(current) : value;
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      setStoredValue(valueToStore);
      window.dispatchEvent(
        new CustomEvent(LOCAL_STORAGE_EVENT, {
          detail: { key, value: valueToStore }
        })
      );
    },
    [key]
  );

  useEffect(() => {
    // Keep state in sync when a different storage key is selected dynamically.
    setStoredValue(readLocalStorageValue(key, initialValueRef.current));
  }, [key]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== key) return;
      setStoredValue(readLocalStorageValue(key, initialValueRef.current));
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
