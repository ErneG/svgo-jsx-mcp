/**
 * Web Component Generator
 *
 * Generates a vanilla Web Component (Custom Element) from optimized SVG.
 * Uses Shadow DOM for style encapsulation.
 */

import type { GeneratorOptions, GeneratorResult } from "./types.js";

/**
 * Convert component name to kebab-case for custom element registration
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

/**
 * Convert SVG content to a Web Component class
 */
export function generateWebComponent(svg: string, options: GeneratorOptions): GeneratorResult {
  const { componentName, typescript = true } = options;

  // Generate element name (must contain a hyphen)
  const elementName = toKebabCase(componentName);
  const validElementName = elementName.includes("-") ? elementName : `svg-${elementName}`;

  // Extract SVG attributes
  const svgMatch = svg.match(/<svg([^>]*)>/);
  const svgAttrs = svgMatch ? svgMatch[1] : "";

  // Parse existing width/height from SVG
  const widthMatch = svgAttrs.match(/width=["']([^"']*)["']/);
  const heightMatch = svgAttrs.match(/height=["']([^"']*)["']/);
  const defaultWidth = widthMatch ? widthMatch[1] : "24";
  const defaultHeight = heightMatch ? heightMatch[1] : "24";

  // Escape backticks and backslashes in SVG for template literal
  const escapedSvg = svg.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

  const typeAnnotations = typescript
    ? `
  private _width: string = '${defaultWidth}';
  private _height: string = '${defaultHeight}';`
    : "";

  const observedAttrsType = typescript ? ": string[]" : "";
  const attrType = typescript ? ": string" : "";
  const valueType = typescript ? ": string | null" : "";

  const code = `/**
 * ${componentName} - SVG Web Component
 * Generated from optimized SVG
 *
 * Usage:
 *   <${validElementName} width="32" height="32"></${validElementName}>
 */
class ${componentName} extends HTMLElement {${typeAnnotations}

  static get observedAttributes()${observedAttrsType} {
    return ['width', 'height'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback()${typescript ? ": void" : ""} {
    this.render();
  }

  attributeChangedCallback(name${attrType}, _oldValue${valueType}, newValue${valueType})${typescript ? ": void" : ""} {
    if (name === 'width' && newValue) {
      this._width = newValue;
    } else if (name === 'height' && newValue) {
      this._height = newValue;
    }
    this.render();
  }

  get width()${typescript ? ": string" : ""} {
    return this._width;
  }

  set width(value${attrType}) {
    this._width = value;
    this.setAttribute('width', value);
  }

  get height()${typescript ? ": string" : ""} {
    return this._height;
  }

  set height(value${attrType}) {
    this._height = value;
    this.setAttribute('height', value);
  }

  render()${typescript ? ": void" : ""} {
    if (!this.shadowRoot) return;

    const svg = \`${escapedSvg}\`;

    // Replace width and height in the SVG
    const modifiedSvg = svg
      .replace(/width=["'][^"']*["']/, \`width="\${this._width}"\`)
      .replace(/height=["'][^"']*["']/, \`height="\${this._height}"\`);

    this.shadowRoot.innerHTML = \`
      <style>
        :host {
          display: inline-block;
          line-height: 0;
        }
        svg {
          display: block;
        }
      </style>
      \${modifiedSvg}
    \`;
  }
}

// Register the custom element
customElements.define('${validElementName}', ${componentName});

export { ${componentName} };
export default ${componentName};
`;

  return {
    code,
    extension: typescript ? ".ts" : ".js",
    language: typescript ? "typescript" : "javascript",
  };
}

export { toKebabCase };
