import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      const value = item ? JSON.parse(item) : initialValue;
      setStoredValue(value);
    } catch (error) {
      // If error also return initialValue
      console.log(`Error reading localStorage key "${key}":`, error);
      setStoredValue(initialValue);
    } finally {
      setIsLoaded(true);
    }
  }, [key, initialValue]);

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, isLoaded] as const;
}

// Hook for simple string values
export function useLocalStorageString(key: string, initialValue: string) {
  const [value, setValue, isLoaded] = useLocalStorage(key, initialValue);
  return [value as string, setValue as (value: string) => void, isLoaded] as const;
}

// Hook for boolean values
export function useLocalStorageBoolean(key: string, initialValue: boolean) {
  const [value, setValue, isLoaded] = useLocalStorage(key, initialValue);
  return [value as boolean, setValue as (value: boolean) => void, isLoaded] as const;
} 