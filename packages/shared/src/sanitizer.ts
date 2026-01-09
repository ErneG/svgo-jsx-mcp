/**
 * SVG Sanitizer - Removes potentially dangerous elements and attributes
 *
 * This sanitizer removes:
 * - Script elements and event handlers
 * - External references (javascript: URLs, data: URLs with scripts)
 * - Potentially dangerous elements (foreignObject, embed, object, iframe)
 */

// Elements that should be completely removed
const DANGEROUS_ELEMENTS = [
  "script",
  "iframe",
  "object",
  "embed",
  "foreignObject",
  "applet",
  "frame",
  "frameset",
  "base",
  "link",
  "meta",
];

// Event handler attributes (on*)
const EVENT_HANDLERS = [
  "onabort",
  "onactivate",
  "onafterprint",
  "onanimationend",
  "onanimationiteration",
  "onanimationstart",
  "onauxclick",
  "onbeforeactivate",
  "onbeforecopy",
  "onbeforecut",
  "onbeforedeactivate",
  "onbeforepaste",
  "onbeforeprint",
  "onbeforeunload",
  "onbegin",
  "onblur",
  "onbounce",
  "oncancel",
  "oncanplay",
  "oncanplaythrough",
  "oncellchange",
  "onchange",
  "onclick",
  "onclose",
  "oncontextmenu",
  "oncopy",
  "oncuechange",
  "oncut",
  "ondataavailable",
  "ondatasetchanged",
  "ondatasetcomplete",
  "ondblclick",
  "ondeactivate",
  "ondrag",
  "ondragdrop",
  "ondragend",
  "ondragenter",
  "ondragleave",
  "ondragover",
  "ondragstart",
  "ondrop",
  "ondurationchange",
  "onemptied",
  "onend",
  "onended",
  "onerror",
  "onerrorupdate",
  "onfilterchange",
  "onfinish",
  "onfocus",
  "onfocusin",
  "onfocusout",
  "onformchange",
  "onforminput",
  "onfullscreenchange",
  "onfullscreenerror",
  "ongotpointercapture",
  "onhashchange",
  "onhelp",
  "oninput",
  "oninvalid",
  "onkeydown",
  "onkeypress",
  "onkeyup",
  "onlanguagechange",
  "onlayoutcomplete",
  "onload",
  "onloadeddata",
  "onloadedmetadata",
  "onloadstart",
  "onlosecapture",
  "onlostpointercapture",
  "onmessage",
  "onmessageerror",
  "onmousedown",
  "onmouseenter",
  "onmouseleave",
  "onmousemove",
  "onmouseout",
  "onmouseover",
  "onmouseup",
  "onmousewheel",
  "onmove",
  "onmoveend",
  "onmovestart",
  "onoffline",
  "ononline",
  "onorientationchange",
  "onpagehide",
  "onpageshow",
  "onpaste",
  "onpause",
  "onplay",
  "onplaying",
  "onpointercancel",
  "onpointerdown",
  "onpointerenter",
  "onpointerleave",
  "onpointermove",
  "onpointerout",
  "onpointerover",
  "onpointerup",
  "onpopstate",
  "onprogress",
  "onpropertychange",
  "onratechange",
  "onreadystatechange",
  "onrepeat",
  "onreset",
  "onresize",
  "onresizeend",
  "onresizestart",
  "onrowenter",
  "onrowexit",
  "onrowsdelete",
  "onrowsinserted",
  "onscroll",
  "onsearch",
  "onseeked",
  "onseeking",
  "onselect",
  "onselectstart",
  "onshow",
  "onstalled",
  "onstart",
  "onstop",
  "onstorage",
  "onsubmit",
  "onsuspend",
  "ontimeupdate",
  "ontoggle",
  "ontouchcancel",
  "ontouchend",
  "ontouchmove",
  "ontouchstart",
  "ontransitionend",
  "onunload",
  "onvolumechange",
  "onwaiting",
  "onwheel",
];

// Dangerous URL schemes
const DANGEROUS_URL_SCHEMES = ["javascript:", "vbscript:", "data:text/html", "data:application/"];

export interface SanitizeOptions {
  /** Remove script elements (default: true) */
  removeScripts?: boolean;
  /** Remove event handlers (default: true) */
  removeEventHandlers?: boolean;
  /** Remove dangerous elements like foreignObject (default: true) */
  removeDangerousElements?: boolean;
  /** Remove dangerous URL schemes (default: true) */
  removeDangerousUrls?: boolean;
}

export interface SanitizeResult {
  /** The sanitized SVG content */
  sanitized: string;
  /** Whether any modifications were made */
  modified: boolean;
  /** List of issues found and removed */
  issues: string[];
}

/**
 * Sanitize SVG content to remove XSS vectors
 */
export function sanitizeSvg(svg: string, options: SanitizeOptions = {}): SanitizeResult {
  const {
    removeScripts = true,
    removeEventHandlers = true,
    removeDangerousElements = true,
    removeDangerousUrls = true,
  } = options;

  let sanitized = svg;
  const issues: string[] = [];

  // Remove dangerous elements
  if (removeDangerousElements || removeScripts) {
    const elements = removeScripts
      ? DANGEROUS_ELEMENTS
      : DANGEROUS_ELEMENTS.filter((e) => e !== "script");

    for (const element of elements) {
      // Match both self-closing and regular elements
      const selfClosingRegex = new RegExp(`<${element}[^>]*/>`, "gi");
      const openingRegex = new RegExp(`<${element}[^>]*>[\\s\\S]*?</${element}>`, "gi");

      const selfClosingMatches = sanitized.match(selfClosingRegex);
      const openingMatches = sanitized.match(openingRegex);

      if (selfClosingMatches || openingMatches) {
        issues.push(`Removed <${element}> element(s)`);
        sanitized = sanitized.replace(selfClosingRegex, "");
        sanitized = sanitized.replace(openingRegex, "");
      }
    }
  }

  // Remove event handlers
  if (removeEventHandlers) {
    for (const handler of EVENT_HANDLERS) {
      const regex = new RegExp(`\\s${handler}\\s*=\\s*["'][^"']*["']`, "gi");
      if (regex.test(sanitized)) {
        issues.push(`Removed ${handler} attribute(s)`);
        sanitized = sanitized.replace(regex, "");
      }
    }
  }

  // Remove dangerous URL schemes
  if (removeDangerousUrls) {
    for (const scheme of DANGEROUS_URL_SCHEMES) {
      // Match href, xlink:href, src, and other URL-containing attributes
      const hrefRegex = new RegExp(
        `(href|xlink:href|src|action)\\s*=\\s*["']${scheme}[^"']*["']`,
        "gi"
      );
      if (hrefRegex.test(sanitized)) {
        issues.push(`Removed ${scheme} URL(s)`);
        sanitized = sanitized.replace(hrefRegex, "");
      }
    }
  }

  return {
    sanitized,
    modified: issues.length > 0,
    issues,
  };
}

/**
 * Check if SVG content contains potentially dangerous content
 * Returns a list of warnings without modifying the content
 */
export function checkSvgSecurity(svg: string): string[] {
  const warnings: string[] = [];

  // Check for dangerous elements
  for (const element of DANGEROUS_ELEMENTS) {
    const regex = new RegExp(`<${element}[\\s>]`, "i");
    if (regex.test(svg)) {
      warnings.push(`Contains potentially dangerous <${element}> element`);
    }
  }

  // Check for event handlers
  for (const handler of EVENT_HANDLERS) {
    const regex = new RegExp(`\\s${handler}\\s*=`, "i");
    if (regex.test(svg)) {
      warnings.push(`Contains event handler: ${handler}`);
    }
  }

  // Check for dangerous URL schemes
  for (const scheme of DANGEROUS_URL_SCHEMES) {
    if (svg.toLowerCase().includes(scheme.toLowerCase())) {
      warnings.push(`Contains dangerous URL scheme: ${scheme}`);
    }
  }

  return warnings;
}

/**
 * Validate SVG content size
 */
export function validateContentSize(content: string, maxSize: number = 1024 * 1024): void {
  const size = Buffer.byteLength(content, "utf8");
  if (size > maxSize) {
    throw new Error(
      `SVG content too large (${formatBytes(size)}). Maximum size is ${formatBytes(maxSize)}.`
    );
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const size = bytes / Math.pow(k, i);

  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
