const STORAGE_PREFIX = 'product_checker_';

export function setStorage<T>(key: string, value: T): void {
  try {
    const fullKey = STORAGE_PREFIX + key;
    localStorage.setItem(fullKey, JSON.stringify(value));
  } catch (error) {
    console.error('Storage set error:', error);
  }
}

export function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const fullKey = STORAGE_PREFIX + key;
    const value = localStorage.getItem(fullKey);
    if (value === null) return defaultValue;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('Storage get error:', error);
    return defaultValue;
  }
}

export function removeStorage(key: string): void {
  try {
    const fullKey = STORAGE_PREFIX + key;
    localStorage.removeItem(fullKey);
  } catch (error) {
    console.error('Storage remove error:', error);
  }
}
