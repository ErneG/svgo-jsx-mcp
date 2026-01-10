/**
 * Svelte Component Generator
 *
 * Generates a Svelte component from optimized SVG.
 * Uses Svelte 4/5 compatible syntax with exported props.
 */

import type { GeneratorOptions, GeneratorResult } from "./types.js";

/**
 * Convert SVG content to a Svelte component
 */
export function generateSvelteComponent(svg: string, options: GeneratorOptions): GeneratorResult {
  const { componentName, typescript = true } = options;

  // Extract SVG attributes
  const svgMatch = svg.match(/<svg([^>]*)>/);
  const svgAttrs = svgMatch ? svgMatch[1] : "";

  // Parse existing width/height from SVG
  const widthMatch = svgAttrs.match(/width=["']([^"']*)["']/);
  const heightMatch = svgAttrs.match(/height=["']([^"']*)["']/);
  const defaultWidth = widthMatch ? widthMatch[1] : undefined;
  const defaultHeight = heightMatch ? heightMatch[1] : undefined;

  // Remove width/height from SVG since we'll bind them dynamically
  let modifiedSvg = svg;
  if (widthMatch || heightMatch) {
    modifiedSvg = svg.replace(/<svg([^>]*)>/, (match, attrs) => {
      let newAttrs = attrs;
      if (widthMatch) {
        newAttrs = newAttrs.replace(/\s*width=["'][^"']*["']/g, "");
      }
      if (heightMatch) {
        newAttrs = newAttrs.replace(/\s*height=["'][^"']*["']/g, "");
      }
      return `<svg${newAttrs}>`;
    });
  }

  // Add dynamic width/height bindings and rest props to SVG
  // In String.replace(), $$ in the replacement becomes a literal $
  // So we need $$$$ to get $$
  modifiedSvg = modifiedSvg.replace(/<svg([^>]*)>/, "<svg$1 {width} {height} {...$$$$restProps}>");

  // Indent SVG content for readability
  const indentedSvg = modifiedSvg
    .split("\n")
    .map((line) => line)
    .join("\n");

  const scriptLang = typescript ? ' lang="ts"' : "";

  const propsDefinition = typescript
    ? `  /** Width of the SVG */
  export let width: string | number${defaultWidth ? ` = '${defaultWidth}'` : ""};
  /** Height of the SVG */
  export let height: string | number${defaultHeight ? ` = '${defaultHeight}'` : ""};`
    : `  /** Width of the SVG */
  export let width${defaultWidth ? ` = '${defaultWidth}'` : ""};
  /** Height of the SVG */
  export let height${defaultHeight ? ` = '${defaultHeight}'` : ""};`;

  const code = `<script${scriptLang}>
  /**
   * ${componentName} - SVG Icon Component
   * Generated from optimized SVG
   */

${propsDefinition}
</script>

${indentedSvg}
`;

  return {
    code,
    extension: ".svelte",
    language: "svelte",
  };
}
