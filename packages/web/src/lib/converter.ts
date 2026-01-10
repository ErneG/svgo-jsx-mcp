/**
 * SVG to Raster Image Converter
 *
 * Converts SVG content to PNG, WebP, or JPEG formats
 * using resvg-js for SVG rendering and sharp for format conversion.
 */

import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

export type OutputFormat = "png" | "webp" | "jpeg";
export type Scale = 1 | 2 | 3;

export interface ConvertOptions {
  /** Output format (png, webp, jpeg) */
  format: OutputFormat;
  /** Scale factor (1x, 2x, 3x) */
  scale?: Scale;
  /** Quality for lossy formats (1-100, default 90) */
  quality?: number;
  /** Background color (default transparent for PNG, white for JPEG) */
  background?: string;
  /** Custom width (overrides scale) */
  width?: number;
  /** Custom height (overrides scale) */
  height?: number;
}

export interface ConvertResult {
  /** Image buffer */
  buffer: Buffer;
  /** MIME type */
  mimeType: string;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** File size in bytes */
  size: number;
}

/**
 * Get dimensions from SVG content
 */
function getSvgDimensions(svg: string): { width: number; height: number } {
  // Try to get dimensions from width/height attributes
  const widthMatch = svg.match(/width=["'](\d+(?:\.\d+)?)/);
  const heightMatch = svg.match(/height=["'](\d+(?:\.\d+)?)/);

  if (widthMatch && heightMatch) {
    return {
      width: parseFloat(widthMatch[1]),
      height: parseFloat(heightMatch[1]),
    };
  }

  // Try to get from viewBox
  const viewBoxMatch = svg.match(/viewBox=["']([^"']+)["']/);
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].split(/\s+/).map(parseFloat);
    if (parts.length >= 4) {
      return {
        width: parts[2],
        height: parts[3],
      };
    }
  }

  // Default dimensions if nothing found
  return { width: 100, height: 100 };
}

/**
 * Convert SVG content to a raster image format
 */
export async function convertSvg(svg: string, options: ConvertOptions): Promise<ConvertResult> {
  const { format, scale = 1, quality = 90, background, width, height } = options;

  // Get base dimensions from SVG
  const baseDimensions = getSvgDimensions(svg);

  // Calculate output dimensions
  const outputWidth = width || Math.round(baseDimensions.width * scale);
  const outputHeight = height || Math.round(baseDimensions.height * scale);

  // Render SVG to PNG buffer using resvg
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: outputWidth,
    },
    background: background || (format === "jpeg" ? "#ffffff" : undefined),
  });

  const renderedImage = resvg.render();
  const pngBuffer = renderedImage.asPng();

  // Convert to target format using sharp
  let sharpInstance = sharp(pngBuffer);

  // Resize if needed (resvg handles width, sharp ensures exact dimensions)
  sharpInstance = sharpInstance.resize(outputWidth, outputHeight, {
    fit: "contain",
    background: background || (format === "jpeg" ? "#ffffff" : { r: 0, g: 0, b: 0, alpha: 0 }),
  });

  let outputBuffer: Buffer;
  let mimeType: string;

  switch (format) {
    case "webp":
      outputBuffer = await sharpInstance.webp({ quality }).toBuffer();
      mimeType = "image/webp";
      break;
    case "jpeg":
      outputBuffer = await sharpInstance
        .flatten({ background: background || "#ffffff" })
        .jpeg({ quality })
        .toBuffer();
      mimeType = "image/jpeg";
      break;
    case "png":
    default:
      outputBuffer = await sharpInstance.png().toBuffer();
      mimeType = "image/png";
      break;
  }

  return {
    buffer: outputBuffer,
    mimeType,
    width: outputWidth,
    height: outputHeight,
    size: outputBuffer.length,
  };
}

/**
 * Get file extension for format
 */
export function getExtension(format: OutputFormat): string {
  switch (format) {
    case "webp":
      return "webp";
    case "jpeg":
      return "jpg";
    case "png":
    default:
      return "png";
  }
}

/**
 * Validate conversion options
 */
export function validateOptions(options: Partial<ConvertOptions>): ConvertOptions {
  const format = options.format || "png";
  const scale = options.scale || 1;
  const quality = Math.min(100, Math.max(1, options.quality || 90));

  if (!["png", "webp", "jpeg"].includes(format)) {
    throw new Error(`Invalid format: ${format}. Must be png, webp, or jpeg`);
  }

  if (![1, 2, 3].includes(scale)) {
    throw new Error(`Invalid scale: ${scale}. Must be 1, 2, or 3`);
  }

  return {
    format: format as OutputFormat,
    scale: scale as Scale,
    quality,
    background: options.background,
    width: options.width,
    height: options.height,
  };
}
