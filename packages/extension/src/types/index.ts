/**
 * Extension Types
 */

export type OutputFormat = "svg" | "react" | "vue" | "svelte" | "web-component";

export interface OptimizationResult {
  success: boolean;
  originalSize: number;
  optimizedSize: number;
  savedPercent: string;
  output: string;
  format: OutputFormat;
}

export interface SVGInfo {
  id: string;
  content: string;
  source: "inline" | "img" | "object" | "background";
  url?: string;
  dimensions?: { width: number; height: number };
}

export interface StorageData {
  theme: "light" | "dark" | "system";
  defaultFormat: OutputFormat;
  history: HistoryItem[];
  favorites: string[];
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  originalSvg: string;
  optimizedSvg: string;
  format: OutputFormat;
  savedPercent: string;
}

export interface Message {
  type: "OPTIMIZE_SVG" | "SCAN_PAGE" | "GET_SVG" | "OPTIMIZATION_RESULT";
  payload?: unknown;
}

export interface OptimizeSvgMessage extends Message {
  type: "OPTIMIZE_SVG";
  payload: {
    svg: string;
    format: OutputFormat;
  };
}

export interface ScanPageMessage extends Message {
  type: "SCAN_PAGE";
}

export interface GetSvgMessage extends Message {
  type: "GET_SVG";
  payload: {
    selector: string;
  };
}

export interface OptimizationResultMessage extends Message {
  type: "OPTIMIZATION_RESULT";
  payload: OptimizationResult;
}
