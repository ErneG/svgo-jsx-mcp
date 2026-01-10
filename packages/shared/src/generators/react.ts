/**
 * React Component Generator
 *
 * Generates a React functional component from optimized SVG.
 * The SVG should already have camelCase attributes applied.
 */

import type { GeneratorOptions, GeneratorResult } from "./types.js";

/**
 * Convert SVG content to a React functional component
 */
export function generateReactComponent(svg: string, options: GeneratorOptions): GeneratorResult {
  const { componentName, typescript = true, exportDefault = true } = options;

  // Extract SVG attributes to pass through as props
  const svgMatch = svg.match(/<svg([^>]*)>/);
  const svgAttrs = svgMatch ? svgMatch[1] : "";

  // Parse existing width/height from SVG
  const widthMatch = svgAttrs.match(/width=["']([^"']*)["']/);
  const heightMatch = svgAttrs.match(/height=["']([^"']*)["']/);
  const hasWidth = !!widthMatch;
  const hasHeight = !!heightMatch;

  // Remove width/height from SVG since we'll pass them as props
  let modifiedSvg = svg;
  if (hasWidth || hasHeight) {
    modifiedSvg = svg.replace(/<svg([^>]*)>/, (match, attrs) => {
      let newAttrs = attrs;
      if (hasWidth) {
        newAttrs = newAttrs.replace(/\s*width=["'][^"']*["']/g, "");
      }
      if (hasHeight) {
        newAttrs = newAttrs.replace(/\s*height=["'][^"']*["']/g, "");
      }
      return `<svg${newAttrs}>`;
    });
  }

  // Add {...props} to the SVG element for spreading additional props
  modifiedSvg = modifiedSvg.replace(/<svg([^>]*)>/, "<svg$1 {...props}>");

  // Indent SVG content for readability
  const indentedSvg = modifiedSvg
    .split("\n")
    .map((line, i) => (i === 0 ? line : "    " + line))
    .join("\n");

  const propsType = typescript
    ? `interface ${componentName}Props extends React.SVGProps<SVGSVGElement> {
  /** Width of the SVG */
  width?: number | string;
  /** Height of the SVG */
  height?: number | string;
}`
    : "";

  const propsParam = typescript
    ? `{ width${hasWidth ? ` = "${widthMatch![1]}"` : ""}, height${hasHeight ? ` = "${heightMatch![1]}"` : ""}, ...props }: ${componentName}Props`
    : `{ width${hasWidth ? ` = "${widthMatch![1]}"` : ""}, height${hasHeight ? ` = "${heightMatch![1]}"` : ""}, ...props }`;

  const exportStatement = exportDefault
    ? `export default ${componentName};`
    : `export { ${componentName} };`;

  const code = `${typescript ? 'import type { SVGProps } from "react";\n\n' : ""}${propsType ? propsType + "\n\n" : ""}function ${componentName}(${propsParam}) {
  return (
    ${indentedSvg}
  );
}

${exportStatement}
`;

  return {
    code,
    extension: typescript ? ".tsx" : ".jsx",
    language: typescript ? "typescript" : "javascript",
  };
}

/**
 * Generate a component name from a filename
 */
export function filenameToComponentName(filename: string): string {
  // Remove file extension
  const baseName = filename.replace(/\.[^.]+$/, "");

  // Convert to PascalCase
  return baseName
    .replace(/[^a-zA-Z0-9]+/g, " ") // Replace non-alphanumeric with spaces
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}
