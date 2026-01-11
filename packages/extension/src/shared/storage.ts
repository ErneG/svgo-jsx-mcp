/**
 * Chrome Storage Wrapper
 */

import type { StorageData, HistoryItem, OutputFormat } from "@/types";

const STORAGE_KEYS = {
  theme: "theme",
  defaultFormat: "defaultFormat",
  history: "history",
  favorites: "favorites",
} as const;

const DEFAULT_STORAGE: StorageData = {
  theme: "system",
  defaultFormat: "react",
  history: [],
  favorites: [],
};

/**
 * Get a value from Chrome storage
 */
export async function getStorageValue<K extends keyof StorageData>(
  key: K
): Promise<StorageData[K]> {
  const result = await chrome.storage.local.get(key);
  return (result[key] as StorageData[K]) ?? DEFAULT_STORAGE[key];
}

/**
 * Set a value in Chrome storage
 */
export async function setStorageValue<K extends keyof StorageData>(
  key: K,
  value: StorageData[K]
): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

/**
 * Get all storage data
 */
export async function getAllStorage(): Promise<StorageData> {
  const result = await chrome.storage.local.get(Object.keys(STORAGE_KEYS));
  return {
    ...DEFAULT_STORAGE,
    ...result,
  } as StorageData;
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
