/**
 * Vue 3 SFC Generator
 *
 * Generates a Vue 3 Single File Component from optimized SVG.
 * Uses <script setup> syntax for modern Vue 3 composition API.
 */

import type { GeneratorOptions, GeneratorResult } from "./types.js";

/**
 * Convert SVG content to a Vue 3 Single File Component
 */
export function generateVueComponent(svg: string, options: GeneratorOptions): GeneratorResult {
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

  // Add dynamic width/height bindings to SVG
  modifiedSvg = modifiedSvg.replace(
    /<svg([^>]*)>/,
    '<svg$1 :width="width" :height="height" v-bind="$attrs">'
  );

  // Indent SVG content for readability
  const indentedSvg = modifiedSvg
    .split("\n")
    .map((line) => "    " + line)
    .join("\n");

  const propsDefinition = typescript
    ? `const props = withDefaults(defineProps<{
  width?: string | number;
  height?: string | number;
}>(), {
  width: ${defaultWidth ? `'${defaultWidth}'` : "undefined"},
  height: ${defaultHeight ? `'${defaultHeight}'` : "undefined"},
});`
    : `const props = defineProps({
  width: {
    type: [String, Number],
    default: ${defaultWidth ? `'${defaultWidth}'` : "undefined"},
  },
  height: {
    type: [String, Number],
    default: ${defaultHeight ? `'${defaultHeight}'` : "undefined"},
  },
});`;

  const scriptLang = typescript ? ' lang="ts"' : "";

  const code = `<script setup${scriptLang}>
/**
 * ${componentName} - SVG Icon Component
 * Generated from optimized SVG
 */

${propsDefinition}

const { width, height } = props;
</script>

<template>
${indentedSvg}
</template>
`;

  return {
    code,
    extension: ".vue",
    language: "vue",
  };
}
