/**
 * Content Script
 * Runs on all pages to detect and extract SVGs
 */

import type { SVGInfo } from "@/types";

/**
 * Get SVG element at click position
 */
function getSvgAtPosition(x: number, y: number): string | null {
  const element = document.elementFromPoint(x, y);
  if (!element) return null;

  // Check if clicked element is an SVG or inside an SVG
  const svgElement = element.closest("svg") || (element.tagName === "svg" ? element : null);
  if (svgElement) {
    return svgElement.outerHTML;
  }

  // Check if it's an img with SVG source
  if (element.tagName === "IMG") {
    const img = element as HTMLImageElement;
    if (img.src.endsWith(".svg") || img.src.startsWith("data:image/svg+xml")) {
      return fetchSvgFromUrl(img.src);
    }
  }

  // Check if it's an object with SVG
  if (element.tagName === "OBJECT") {
    const obj = element as HTMLObjectElement;
    if (obj.type === "image/svg+xml" || obj.data.endsWith(".svg")) {
      const svgDoc = obj.contentDocument;
      if (svgDoc) {
        const innerSvg = svgDoc.querySelector("svg");
        if (innerSvg) return innerSvg.outerHTML;
      }
    }
  }

  return null;
}

/**
 * Fetch SVG content from URL (for img src)
 */
function fetchSvgFromUrl(url: string): string | null {
  if (url.startsWith("data:image/svg+xml")) {
    // Handle data URI
    const base64Match = url.match(/data:image\/svg\+xml;base64,(.+)/);
    if (base64Match?.[1]) {
      try {
        return atob(base64Match[1]);
      } catch {
        return null;
      }
    }

    const encodedMatch = url.match(/data:image\/svg\+xml,(.+)/);
    if (encodedMatch?.[1]) {
      try {
        return decodeURIComponent(encodedMatch[1]);
      } catch {
        return null;
      }
    }
  }

  // For external URLs, we can't fetch due to CORS
  // Return null and let the user know
  return null;
}

/**
 * Scan page for all SVG elements
 */
function scanPageForSvgs(): SVGInfo[] {
  const svgs: SVGInfo[] = [];
  let idCounter = 0;

  // Find inline SVGs
  document.querySelectorAll("svg").forEach((svg) => {
    const rect = svg.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      svgs.push({
        id: `svg-${idCounter++}`,
        content: svg.outerHTML,
        source: "inline",
        dimensions: { width: rect.width, height: rect.height },
      });
    }
  });

  // Find img elements with SVG sources
  document.querySelectorAll('img[src$=".svg"], img[src^="data:image/svg+xml"]').forEach((img) => {
    const imgEl = img as HTMLImageElement;
    const rect = imgEl.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
      const content = fetchSvgFromUrl(imgEl.src);
      if (content) {
        svgs.push({
          id: `svg-${idCounter++}`,
          content,
          source: "img",
          url: imgEl.src,
          dimensions: { width: rect.width, height: rect.height },
        });
      } else {
        // External URL, can't fetch but record it
        svgs.push({
          id: `svg-${idCounter++}`,
          content: "", // Will need to be fetched
          source: "img",
          url: imgEl.src,
          dimensions: { width: rect.width, height: rect.height },
        });
      }
    }
  });

  // Find object elements with SVG
  document.querySelectorAll('object[type="image/svg+xml"], object[data$=".svg"]').forEach((obj) => {
    const objEl = obj as HTMLObjectElement;
    const rect = objEl.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
      try {
        const svgDoc = objEl.contentDocument;
        if (svgDoc) {
          const innerSvg = svgDoc.querySelector("svg");
          if (innerSvg) {
            svgs.push({
              id: `svg-${idCounter++}`,
              content: innerSvg.outerHTML,
              source: "object",
              url: objEl.data,
              dimensions: { width: rect.width, height: rect.height },
            });
          }
        }
      } catch {
        // Cross-origin object, can't access
        svgs.push({
          id: `svg-${idCounter++}`,
          content: "",
          source: "object",
          url: objEl.data,
          dimensions: { width: rect.width, height: rect.height },
        });
      }
    }
  });

  return svgs;
}

/**
 * Highlight SVGs on page (for scan mode)
 */
function highlightSvgs(show: boolean): void {
  const existingOverlays = document.querySelectorAll(".svgo-jsx-highlight");
  existingOverlays.forEach((el) => el.remove());

  if (!show) return;

  document.querySelectorAll("svg").forEach((svg, index) => {
    const rect = svg.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const overlay = document.createElement("div");
      overlay.className = "svgo-jsx-highlight";
      overlay.style.cssText = `
        position: fixed;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border: 2px solid #3b82f6;
        background: rgba(59, 130, 246, 0.1);
        pointer-events: none;
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      overlay.innerHTML = `<span style="background: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-family: system-ui;">${index + 1}</span>`;
      document.body.appendChild(overlay);
    }
  });
}

/**
 * Listen for messages from background script
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case "GET_CLICKED_SVG": {
      const svg = getSvgAtPosition(message.payload.x, message.payload.y);
      sendResponse({ svg });
      break;
    }

    case "SCAN_PAGE": {
      const svgs = scanPageForSvgs();
      sendResponse({ svgs });
      break;
    }

    case "HIGHLIGHT_SVGS": {
      highlightSvgs(message.payload.show);
      sendResponse({ success: true });
      break;
    }

    case "GET_SVG_BY_INDEX": {
      const allSvgs = document.querySelectorAll("svg");
      const targetSvg = allSvgs[message.payload.index];
      if (targetSvg) {
        sendResponse({ svg: targetSvg.outerHTML });
      } else {
        sendResponse({ svg: null });
      }
      break;
    }
  }

  return false;
});

// Inject styles for highlights
const style = document.createElement("style");
style.textContent = `
  .svgo-jsx-highlight {
    transition: opacity 0.2s ease;
  }
`;
document.head.appendChild(style);

export {};
