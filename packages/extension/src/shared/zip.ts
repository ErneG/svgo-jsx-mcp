/**
 * ZIP file creation utility for batch downloads
 */

import JSZip from "jszip";
import type { OutputFormat } from "@/types";

export interface ZipFile {
  name: string;
  content: string;
}

const FORMAT_EXTENSIONS: Record<OutputFormat, string> = {
  svg: ".svg",
  react: ".tsx",
  vue: ".vue",
  svelte: ".svelte",
  "web-component": ".js",
};

/**
 * Create a ZIP file containing multiple optimized SVGs
 */
export async function createZip(files: ZipFile[]): Promise<Blob> {
  const zip = new JSZip();

  // Track used names to avoid duplicates
  const usedNames = new Map<string, number>();

  files.forEach((file) => {
    let name = file.name;

    // Handle duplicate names
    if (usedNames.has(name)) {
      const count = usedNames.get(name)! + 1;
      usedNames.set(name, count);
      const ext = name.lastIndexOf(".");
      if (ext > 0) {
        name = `${name.substring(0, ext)}-${count}${name.substring(ext)}`;
      } else {
        name = `${name}-${count}`;
      }
    } else {
      usedNames.set(name, 0);
    }

    zip.file(name, file.content);
  });

  return zip.generateAsync({ type: "blob" });
}

/**
 * Generate filename for an optimized SVG
 */
export function generateFilename(
  index: number,
  format: OutputFormat,
  originalUrl?: string
): string {
  let baseName: string;

  if (originalUrl && !originalUrl.startsWith("data:")) {
    // Extract filename from URL
    const urlPath = originalUrl.split("?")[0] ?? "";
    const urlParts = urlPath.split("/");
    const fileName = urlParts[urlParts.length - 1] ?? "";

    // Remove extension from original filename
    baseName = fileName.replace(/\.[^/.]+$/, "") || `svg-${index + 1}`;
  } else {
    baseName = `svg-${index + 1}`;
  }

  // Sanitize filename
  baseName = baseName.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-");

  return `${baseName}${FORMAT_EXTENSIONS[format]}`;
}

/**
 * Trigger download of a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Create and download a ZIP file of optimized SVGs
 */
export async function downloadAsZip(files: ZipFile[], zipName?: string): Promise<void> {
  const blob = await createZip(files);
  const name = zipName || `optimized-svgs-${Date.now()}.zip`;
  downloadBlob(blob, name);
}
