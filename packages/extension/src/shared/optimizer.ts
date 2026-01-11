/**
 * SVG Optimizer - Client-side optimization using SVGO
 */

import { optimize } from "svgo";
import type { OutputFormat, OptimizationResult } from "@/types";

/**
 * Convert kebab-case to camelCase
 */
function kebabToCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

/**
 * Convert SVG attributes to camelCase for JSX compatibility
 */
function convertAttributesToCamelCase(svg: string): string {
  return svg.replace(
    /\s([a-z][a-z0-9]*(?:-[a-z0-9]+)+)(\s*=\s*["'][^"']*["'])/gi,
    (_, attrName: string, attrValue: string) => {
      const camelCaseName = kebabToCamelCase(attrName);
      return ` ${camelCaseName}${attrValue}`;
    }
  );
}

/**
 * Generate component name from text
 */
export function generateComponentName(input: string): string {
  // Try to extract a meaningful name from the SVG
  const titleMatch = input.match(/<title>([^<]+)<\/title>/i);
  const idMatch = input.match(/<svg[^>]*id=["']([^"']+)["']/i);
  const classMatch = input.match(/<svg[^>]*class=["']([^"']+)["']/i);

  const baseName = titleMatch?.[1] || idMatch?.[1] || classMatch?.[1] || "Icon";

  return baseName
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

/**
 * Generate React component from optimized SVG
 */
function generateReactComponent(svg: string, componentName: string): string {
  const svgMatch = svg.match(/<svg([^>]*)>/);
  const svgAttrs = svgMatch?.[1] ?? "";

  const widthMatch = svgAttrs.match(/width=["']([^"']*)["']/);
  const heightMatch = svgAttrs.match(/height=["']([^"']*)["']/);

  let modifiedSvg = svg;
  if (widthMatch || heightMatch) {
    modifiedSvg = svg.replace(/<svg([^>]*)>/, (_, attrs) => {
      let newAttrs = attrs;
      if (widthMatch) newAttrs = newAttrs.replace(/\s*width=["'][^"']*["']/g, "");
      if (heightMatch) newAttrs = newAttrs.replace(/\s*height=["'][^"']*["']/g, "");
      return `<svg${newAttrs}>`;
    });
  }

  modifiedSvg = modifiedSvg.replace(/<svg([^>]*)>/, "<svg$1 {...props}>");

  const defaultWidth = widthMatch ? ` = "${widthMatch[1]}"` : "";
  const defaultHeight = heightMatch ? ` = "${heightMatch[1]}"` : "";

  return `interface ${componentName}Props extends React.SVGProps<SVGSVGElement> {
  width?: number | string;
  height?: number | string;
}

function ${componentName}({ width${defaultWidth}, height${defaultHeight}, ...props }: ${componentName}Props) {
  return (
    ${modifiedSvg}
  );
}

export default ${componentName};
`;
}

/**
 * Generate Vue SFC from optimized SVG
 */
function generateVueComponent(svg: string, _componentName: string): string {
  return `<script setup lang="ts">
interface Props {
  width?: number | string;
  height?: number | string;
}

defineProps<Props>();
</script>

<template>
  ${svg}
</template>
`;
}

/**
 * Generate Svelte component from optimized SVG
 */
function generateSvelteComponent(svg: string): string {
  // Convert camelCase back to kebab-case for Svelte
  const svelteSvg = svg.replace(/\s([a-z]+[A-Z][a-zA-Z]*)=/g, (_, attr: string) => {
    const kebab = attr.replace(/([A-Z])/g, "-$1").toLowerCase();
    return ` ${kebab}=`;
  });

  return `<script lang="ts">
  export let width: number | string | undefined = undefined;
  export let height: number | string | undefined = undefined;
</script>

${svelteSvg}
`;
}

/**
 * Generate Web Component from optimized SVG
 */
function generateWebComponent(svg: string, componentName: string): string {
  const tagName = componentName
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "");

  return `class ${componentName} extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const width = this.getAttribute('width') || '24';
    const height = this.getAttribute('height') || '24';

    this.shadowRoot!.innerHTML = \`
      <style>
        :host {
          display: inline-block;
          width: \${width}px;
          height: \${height}px;
        }
        svg {
          width: 100%;
          height: 100%;
        }
      </style>
      ${svg}
    \`;
  }

  static get observedAttributes() {
    return ['width', 'height'];
  }

  attributeChangedCallback() {
    this.render();
  }
}

customElements.define('${tagName}-icon', ${componentName});
`;
}

/**
 * Optimize SVG and generate output in specified format
 */
export function optimizeSvg(
  content: string,
  format: OutputFormat,
  componentName?: string
): OptimizationResult {
  const trimmedContent = content.trim();

  // Validate SVG
  if (!trimmedContent.startsWith("<svg") && !trimmedContent.startsWith("<?xml")) {
    throw new Error("Invalid SVG: must start with <svg or <?xml");
  }

  const originalSize = new Blob([trimmedContent]).size;

  // Optimize with SVGO
  const result = optimize(trimmedContent, {
    multipass: true,
  });

  let optimizedSvg = result.data;

  // Convert to camelCase for JSX-based outputs
  if (format === "react" || format === "web-component") {
    optimizedSvg = convertAttributesToCamelCase(optimizedSvg);
  }

  const optimizedSize = new Blob([optimizedSvg]).size;
  const savedPercent = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

  // Generate output based on format
  const name = componentName || generateComponentName(trimmedContent);
  let output: string;

  switch (format) {
    case "svg":
      output = optimizedSvg;
      break;
    case "react":
      output = generateReactComponent(optimizedSvg, name);
      break;
    case "vue":
      output = generateVueComponent(optimizedSvg, name);
      break;
    case "svelte":
      output = generateSvelteComponent(optimizedSvg);
      break;
    case "web-component":
      output = generateWebComponent(optimizedSvg, name);
      break;
    default:
      output = optimizedSvg;
  }

  return {
    success: true,
    originalSize,
    optimizedSize,
    savedPercent: `${savedPercent}%`,
    output,
    format,
  };
}
