/**
 * Background Service Worker
 * Handles context menus, keyboard shortcuts, and message passing
 */

import type { OutputFormat } from "@/types";

const FORMATS: { id: OutputFormat; label: string }[] = [
  { id: "svg", label: "Optimized SVG" },
  { id: "react", label: "React Component" },
  { id: "vue", label: "Vue Component" },
  { id: "svelte", label: "Svelte Component" },
  { id: "web-component", label: "Web Component" },
];

/**
 * Create context menu items on install
 */
chrome.runtime.onInstalled.addListener(() => {
  // Parent menu item
  chrome.contextMenus.create({
    id: "svgo-jsx-parent",
    title: "SVGO JSX",
    contexts: ["all"],
  });

  // Format submenu items
  FORMATS.forEach((format) => {
    chrome.contextMenus.create({
      id: `optimize-${format.id}`,
      parentId: "svgo-jsx-parent",
      title: `Copy as ${format.label}`,
      contexts: ["all"],
    });
  });

  // Separator
  chrome.contextMenus.create({
    id: "separator",
    parentId: "svgo-jsx-parent",
    type: "separator",
    contexts: ["all"],
  });

  // Scan page option
  chrome.contextMenus.create({
    id: "scan-page",
    parentId: "svgo-jsx-parent",
    title: "Scan Page for SVGs",
    contexts: ["all"],
  });
});

/**
 * Handle context menu clicks
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  const menuItemId = info.menuItemId as string;

  if (menuItemId === "scan-page") {
    // Open popup with scan mode
    await chrome.action.openPopup();
    // Send message to popup to start scan
    setTimeout(() => {
      chrome.runtime.sendMessage({ type: "START_SCAN" });
    }, 100);
    return;
  }

  if (menuItemId.startsWith("optimize-")) {
    const format = menuItemId.replace("optimize-", "") as OutputFormat;

    // Send message to content script to get SVG at click position
    // Note: pageX/pageY not available in MV3, we'll get SVG under cursor via content script
    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: "GET_CLICKED_SVG",
        payload: {
          frameId: info.frameId,
        },
      });

      if (response?.svg) {
        // Send to popup for optimization
        await chrome.storage.local.set({
          pendingOptimization: {
            svg: response.svg,
            format,
          },
        });
        await chrome.action.openPopup();
      } else {
        // No SVG found, show notification
        await showNotification(
          "No SVG Found",
          "Right-click directly on an SVG element to optimize it."
        );
      }
    } catch (error) {
      console.error("Failed to get SVG:", error);
      await showNotification(
        "Error",
        "Could not access the page content. Try refreshing the page."
      );
    }
  }
});

/**
 * Handle keyboard shortcuts
 */
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "optimize-clipboard") {
    // Read from clipboard and optimize
    await chrome.action.openPopup();
    setTimeout(() => {
      chrome.runtime.sendMessage({ type: "PASTE_AND_OPTIMIZE" });
    }, 100);
  } else if (command === "scan-page") {
    await chrome.action.openPopup();
    setTimeout(() => {
      chrome.runtime.sendMessage({ type: "START_SCAN" });
    }, 100);
  }
});

/**
 * Handle messages from content script and popup
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "COPY_TO_CLIPBOARD") {
    // Copy text to clipboard (requires offscreen document in MV3)
    copyToClipboard(message.payload.text)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }

  if (message.type === "SHOW_NOTIFICATION") {
    showNotification(message.payload.title, message.payload.message);
    sendResponse({ success: true });
    return false;
  }
});

/**
 * Copy text to clipboard using offscreen document
 */
async function copyToClipboard(text: string): Promise<void> {
  // In MV3, we need to use an offscreen document for clipboard access
  // For now, we'll send it back to the popup to handle
  await chrome.storage.local.set({ clipboardText: text });
}

/**
 * Show browser notification
 */
async function showNotification(title: string, message: string): Promise<void> {
  // Check if we have notification permission
  const hasPermission = await chrome.permissions.contains({ permissions: ["notifications"] });

  if (hasPermission) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/icon-128.png"),
      title,
      message,
    });
  }
}

export {};
