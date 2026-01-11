/**
 * Chrome Storage Wrapper
 * Falls back to localStorage when not in extension context
 */

import type { StorageData, HistoryItem, OutputFormat } from "@/types";

// Check if running in Chrome extension context
const isExtensionContext = typeof chrome !== "undefined" && chrome.storage?.local;

const STORAGE_PREFIX = "svgo-jsx-";

const DEFAULT_STORAGE: StorageData = {
  theme: "system",
  defaultFormat: "react",
  history: [],
  favorites: [],
};

/**
 * Get a value from Chrome storage or localStorage
 */
export async function getStorageValue<K extends keyof StorageData>(
  key: K
): Promise<StorageData[K]> {
  if (isExtensionContext) {
    const result = await chrome.storage.local.get(key);
    return (result[key] as StorageData[K]) ?? DEFAULT_STORAGE[key];
  }

  // Fallback to localStorage
  const stored = localStorage.getItem(STORAGE_PREFIX + key);
  if (stored) {
    try {
      return JSON.parse(stored) as StorageData[K];
    } catch {
      return DEFAULT_STORAGE[key];
    }
  }
  return DEFAULT_STORAGE[key];
}

/**
 * Set a value in Chrome storage or localStorage
 */
export async function setStorageValue<K extends keyof StorageData>(
  key: K,
  value: StorageData[K]
): Promise<void> {
  if (isExtensionContext) {
    await chrome.storage.local.set({ [key]: value });
  } else {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  }
}

/**
 * Get all storage data
 */
export async function getAllStorage(): Promise<StorageData> {
  if (isExtensionContext) {
    const result = await chrome.storage.local.get(Object.keys(DEFAULT_STORAGE));
    return {
      ...DEFAULT_STORAGE,
      ...result,
    } as StorageData;
  }

  // Fallback to localStorage
  return {
    theme: await getStorageValue("theme"),
    defaultFormat: await getStorageValue("defaultFormat"),
    history: await getStorageValue("history"),
    favorites: await getStorageValue("favorites"),
  };
}

/**
 * Add item to history (max 50 items)
 */
export async function addToHistory(item: Omit<HistoryItem, "id" | "timestamp">): Promise<void> {
  const history = await getStorageValue("history");
  const newItem: HistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };

  const updatedHistory = [newItem, ...history].slice(0, 50);
  await setStorageValue("history", updatedHistory);
}

/**
 * Clear history
 */
export async function clearHistory(): Promise<void> {
  await setStorageValue("history", []);
}

/**
 * Toggle favorite
 */
export async function toggleFavorite(id: string): Promise<boolean> {
  const favorites = await getStorageValue("favorites");
  const isFavorite = favorites.includes(id);

  const updatedFavorites = isFavorite ? favorites.filter((f) => f !== id) : [...favorites, id];

  await setStorageValue("favorites", updatedFavorites);
  return !isFavorite;
}

/**
 * Set default output format
 */
export async function setDefaultFormat(format: OutputFormat): Promise<void> {
  await setStorageValue("defaultFormat", format);
}

/**
 * Set theme preference
 */
export async function setTheme(theme: StorageData["theme"]): Promise<void> {
  await setStorageValue("theme", theme);
}
