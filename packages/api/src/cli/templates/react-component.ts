import path from "node:path";

/**
 * Convert a filename to a valid React component name
 */
export function filenameToComponentName(filename: string): string {
  const name = path.parse(filename).name;

  // Convert to PascalCase
  const pascalCase = name
    .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ""))
    .replace(/^(.)/, (char) => char.toUpperCase());

  // Ensure it starts with a letter
  if (/^[0-9]/.test(pascalCase)) {
    return `Icon${pascalCase}`;
  }

  return pascalCase;
}

export interface ReactComponentOptions {
  componentName?: string;
  typescript?: boolean;
  memo?: boolean;
  propsInterface?: boolean;
}

/**
 * Generate a React component from SVG content
 */
export function generateReactComponent(
  svgContent: string,
  filename: string,
  options: ReactComponentOptions = {}
): string {
  const {
    componentName = filenameToComponentName(filename),
    typescript = true,
    memo = true,
    propsInterface = true,
  } = options;

  // Extract SVG attributes and content
  const svgMatch = svgContent.match(/<svg([^>]*)>([\s\S]*?)<\/svg>/i);

  if (!svgMatch) {
    throw new Error("Invalid SVG content");
  }

  const [, attributes, innerContent] = svgMatch;

  // Parse attributes into an object
  const attrString = attributes
    .trim()
    .replace(/xmlns="[^"]*"/g, "") // Remove xmlns (React handles it)
    .replace(/\s+/g, " ")
    .trim();

  // Build the component
  const lines: string[] = [];

  // Imports
  if (memo) {
    lines.push(`import { memo } from "react";`);
  }

  lines.push("");

  // Props interface
  if (typescript && propsInterface) {
    lines.push(`interface ${componentName}Props extends React.SVGProps<SVGSVGElement> {`);
    lines.push(`  title?: string;`);
    lines.push(`}`);
    lines.push("");
  }

  // Component definition
  const propsType = typescript ? `: ${componentName}Props` : "";
  const funcStart = memo
    ? `const ${componentName} = memo(function ${componentName}({ title, ...props }${propsType}) {`
    : `function ${componentName}({ title, ...props }${propsType}) {`;

  lines.push(funcStart);
  lines.push(`  return (`);
  lines.push(`    <svg${attrString ? ` ${attrString}` : ""} {...props}>`);

  // Add title element if provided
  lines.push(`      {title && <title>{title}</title>}`);

  // Add inner content
  const formattedContent = innerContent
    .trim()
    .split("\n")
    .map((line) => `      ${line.trim()}`)
    .join("\n");

  if (formattedContent) {
    lines.push(formattedContent);
  }

  lines.push(`    </svg>`);
  lines.push(`  );`);

  if (memo) {
    lines.push(`});`);
  } else {
    lines.push(`}`);
  }

  lines.push("");
  lines.push(`export default ${componentName};`);
  lines.push("");

  return lines.join("\n");
}
