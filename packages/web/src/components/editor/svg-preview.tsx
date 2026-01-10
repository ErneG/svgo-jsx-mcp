"use client";

import { useMemo, useState } from "react";
import { AlertCircle, ImageOff } from "lucide-react";

export interface SvgPreviewProps {
  svg: string;
  label?: string;
  className?: string;
}

export function SvgPreview({ svg, label = "Preview", className = "" }: SvgPreviewProps) {
  const [hasError, setHasError] = useState(false);

  // Validate and sanitize SVG content
  const { isValid, sanitizedSvg, errorMessage } = useMemo(() => {
    const trimmed = svg.trim();

    // Reset error state when SVG changes
    setHasError(false);

    // Check if it looks like SVG content
    if (!trimmed) {
      return { isValid: false, sanitizedSvg: "", errorMessage: "No SVG content" };
    }

    // Basic SVG detection
    if (!trimmed.includes("<svg") && !trimmed.startsWith("<?xml")) {
      return { isValid: false, sanitizedSvg: "", errorMessage: "Not valid SVG" };
    }

    // Try to extract just the SVG portion if there's XML declaration
    let svgContent = trimmed;
    if (trimmed.startsWith("<?xml")) {
      const svgStart = trimmed.indexOf("<svg");
      if (svgStart === -1) {
        return { isValid: false, sanitizedSvg: "", errorMessage: "No <svg> tag found" };
      }
      svgContent = trimmed.slice(svgStart);
    }

    // Basic validation - check for closing tag
    if (!svgContent.includes("</svg>") && !svgContent.includes("/>")) {
      return { isValid: false, sanitizedSvg: "", errorMessage: "Incomplete SVG" };
    }

    return { isValid: true, sanitizedSvg: svgContent, errorMessage: null };
  }, [svg]);

  // Handle render errors
  const handleError = () => {
    setHasError(true);
  };

  if (!isValid || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900 rounded-lg ${className}`}
      >
        {errorMessage === "No SVG content" ? (
          <>
            <ImageOff className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-400 dark:text-gray-500">{label}</p>
          </>
        ) : (
          <>
            <AlertCircle className="h-8 w-8 text-amber-400 mb-2" />
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {hasError ? "Failed to render SVG" : errorMessage}
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center h-full bg-white dark:bg-gray-50 rounded-lg overflow-hidden ${className}`}
    >
      <div
        className="max-w-full max-h-full p-4 [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto"
        dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
        onError={handleError}
      />
    </div>
  );
}
