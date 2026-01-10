/**
 * Generator Types - Shared types for component generators
 */

export type OutputFormat = "svg" | "react" | "vue" | "svelte" | "web-component";

export interface GeneratorOptions {
  /** Component name (PascalCase) */
  componentName: string;
  /** Whether to include TypeScript types */
  typescript?: boolean;
  /** Whether to export as default */
  exportDefault?: boolean;
}

export interface GeneratorResult {
  /** The generated component code */
  code: string;
  /** File extension for the component */
  extension: string;
  /** Language for syntax highlighting */
  language: string;
}
