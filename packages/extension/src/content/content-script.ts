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
 * Fetch SVG content from URL or data URI
 */
function fetchSvgFromUrl(url: string): string | null {
  if (url.startsWith("data:image/svg+xml")) {
    // Handle data URI - base64 encoded
    const base64Match = url.match(/data:image\/svg\+xml;base64,(.+)/);
    if (base64Match?.[1]) {
      try {
        return atob(base64Match[1]);
      } catch {
        return null;
      }
    }

    // Handle data URI - URL encoded (with optional charset)
    const encodedMatch = url.match(/data:image\/svg\+xml(?:;[^,]*)?,(.+)/);
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
 * Extract SVG from a use element by finding the referenced symbol
 */
function extractSvgFromUseElement(useEl: SVGUseElement): string | null {
  // Get the href attribute (could be href or xlink:href)
  const href = useEl.getAttribute("href") || useEl.getAttribute("xlink:href");
  if (!href) return null;

  // Check if it's an internal reference (starts with #)
  if (href.startsWith("#")) {
    const symbolId = href.substring(1);
    const symbol = document.getElementById(symbolId);

    if (symbol && (symbol.tagName === "symbol" || symbol.tagName === "svg")) {
      // Create a standalone SVG from the symbol
      const viewBox = symbol.getAttribute("viewBox") || "";
      const width = useEl.getAttribute("width") || symbol.getAttribute("width") || "24";
      const height = useEl.getAttribute("height") || symbol.getAttribute("height") || "24";

      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">${symbol.innerHTML}</svg>`;
    }
  }

  return null;
}

/**
 * Extract SVG from CSS background-image
 */
function extractSvgFromBackgroundImage(element: Element): string | null {
  const style = getComputedStyle(element);
  const bgImage = style.backgroundImage;

  if (bgImage && bgImage.startsWith('url("data:image/svg+xml')) {
    // Extract the data URI from url("...")
    const match = bgImage.match(/url\("(.+?)"\)/);
    if (match?.[1]) {
      return fetchSvgFromUrl(match[1]);
    }
  }

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

  // Find embed elements with SVG
  document.querySelectorAll('embed[type="image/svg+xml"], embed[src$=".svg"]').forEach((embed) => {
    const embedEl = embed as HTMLEmbedElement;
    const rect = embedEl.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
      try {
        const svgDoc = embedEl.getSVGDocument?.();
        if (svgDoc) {
          const innerSvg = svgDoc.querySelector("svg");
          if (innerSvg) {
            svgs.push({
              id: `svg-${idCounter++}`,
              content: innerSvg.outerHTML,
              source: "object", // Using "object" as the type since embed is similar
              url: embedEl.src,
              dimensions: { width: rect.width, height: rect.height },
            });
            return; // Skip adding another entry for this element
          }
        }
      } catch {
        // Cross-origin embed, can't access
      }

      // Record the embed even if we can't access it
      svgs.push({
        id: `svg-${idCounter++}`,
        content: "",
        source: "object",
        url: embedEl.src,
        dimensions: { width: rect.width, height: rect.height },
      });
    }
  });

  // Find SVG sprite use elements (standalone use elements that reference symbols)
  document.querySelectorAll("use[href], use[xlink\\:href]").forEach((use) => {
    const useEl = use as SVGUseElement;
    const parentSvg = useEl.closest("svg");

    // Only process if the use element is in a simple wrapper SVG
    // (not already captured as part of a larger inline SVG)
    if (parentSvg) {
      const rect = parentSvg.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        // Check if this SVG only contains this use element (icon usage pattern)
        const children = parentSvg.children;
        const isSimpleIcon = children.length === 1 && children[0] === useEl;

        if (isSimpleIcon) {
          const extractedSvg = extractSvgFromUseElement(useEl);
          if (extractedSvg) {
            // Check if we already have this SVG (from inline detection)
            const alreadyExists = svgs.some(
              (s) =>
                s.source === "inline" &&
                s.dimensions?.width === rect.width &&
                s.dimensions?.height === rect.height
            );

            if (!alreadyExists) {
              svgs.push({
                id: `svg-${idCounter++}`,
                content: extractedSvg,
                source: "inline",
                dimensions: { width: rect.width, height: rect.height },
              });
            }
          }
        }
      }
    }
  });

  // Find elements with SVG background images (limited to visible elements)
  const elementsWithBg = document.querySelectorAll("[style*='background']");
  elementsWithBg.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const svgContent = extractSvgFromBackgroundImage(el);
      if (svgContent) {
        svgs.push({
          id: `svg-${idCounter++}`,
          content: svgContent,
          source: "background" as const,
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
