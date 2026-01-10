"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { Layers, ArrowLeft, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SvgCodeEditor } from "@/components/editor/svg-code-editor";
import { SvgPreview } from "@/components/editor/svg-preview";
import { SampleSelector } from "@/components/editor/sample-selector";
import { FormatSelector } from "@/components/editor/format-selector";
import { Dropzone } from "@/components/editor/dropzone";
import { ValidationPanel } from "@/components/editor/validation-panel";
import { ExportDropdown } from "@/components/editor/export-dropdown";
import { ThemeToggle } from "@/components/theme-toggle";
import type { SampleSvg } from "@/lib/sample-svgs";
// Import generators directly to avoid pulling in SVGO (Node.js only)
import type { OutputFormat } from "@svgo-jsx/shared/generators/types";
import { generateReactComponent, filenameToComponentName } from "@svgo-jsx/shared/generators/react";
import { generateVueComponent } from "@svgo-jsx/shared/generators/vue";
import { generateSvelteComponent } from "@svgo-jsx/shared/generators/svelte";
import { generateWebComponent } from "@svgo-jsx/shared/generators/web-component";

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <path fill="currentColor" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
</svg>`;

const DEBOUNCE_MS = 300;

// Map of SVG attributes that need camelCase conversion for JSX
const SVG_ATTR_CAMEL_CASE_MAP: Record<string, string> = {
  "accent-height": "accentHeight",
  "alignment-baseline": "alignmentBaseline",
  "arabic-form": "arabicForm",
  "baseline-shift": "baselineShift",
  "cap-height": "capHeight",
  "clip-path": "clipPath",
  "clip-rule": "clipRule",
  "color-interpolation": "colorInterpolation",
  "color-interpolation-filters": "colorInterpolationFilters",
  "color-profile": "colorProfile",
  "color-rendering": "colorRendering",
  "dominant-baseline": "dominantBaseline",
  "enable-background": "enableBackground",
  "fill-opacity": "fillOpacity",
  "fill-rule": "fillRule",
  "flood-color": "floodColor",
  "flood-opacity": "floodOpacity",
  "font-family": "fontFamily",
  "font-size": "fontSize",
  "font-size-adjust": "fontSizeAdjust",
  "font-stretch": "fontStretch",
  "font-style": "fontStyle",
  "font-variant": "fontVariant",
  "font-weight": "fontWeight",
  "glyph-name": "glyphName",
  "glyph-orientation-horizontal": "glyphOrientationHorizontal",
  "glyph-orientation-vertical": "glyphOrientationVertical",
  "horiz-adv-x": "horizAdvX",
  "horiz-origin-x": "horizOriginX",
  "image-rendering": "imageRendering",
  "letter-spacing": "letterSpacing",
  "lighting-color": "lightingColor",
  "marker-end": "markerEnd",
  "marker-mid": "markerMid",
  "marker-start": "markerStart",
  "overline-position": "overlinePosition",
  "overline-thickness": "overlineThickness",
  "paint-order": "paintOrder",
  "panose-1": "panose1",
  "pointer-events": "pointerEvents",
  "rendering-intent": "renderingIntent",
  "shape-rendering": "shapeRendering",
  "stop-color": "stopColor",
  "stop-opacity": "stopOpacity",
  "strikethrough-position": "strikethroughPosition",
  "strikethrough-thickness": "strikethroughThickness",
  "stroke-dasharray": "strokeDasharray",
  "stroke-dashoffset": "strokeDashoffset",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-miterlimit": "strokeMiterlimit",
  "stroke-opacity": "strokeOpacity",
  "stroke-width": "strokeWidth",
  "text-anchor": "textAnchor",
  "text-decoration": "textDecoration",
  "text-rendering": "textRendering",
  "underline-position": "underlinePosition",
  "underline-thickness": "underlineThickness",
  "unicode-bidi": "unicodeBidi",
  "unicode-range": "unicodeRange",
  "units-per-em": "unitsPerEm",
  "v-alphabetic": "vAlphabetic",
  "v-hanging": "vHanging",
  "v-ideographic": "vIdeographic",
  "v-mathematical": "vMathematical",
  "vert-adv-y": "vertAdvY",
  "vert-origin-x": "vertOriginX",
  "vert-origin-y": "vertOriginY",
  "word-spacing": "wordSpacing",
  "writing-mode": "writingMode",
  "x-height": "xHeight",
  "xlink:actuate": "xlinkActuate",
  "xlink:arcrole": "xlinkArcrole",
  "xlink:href": "xlinkHref",
  "xlink:role": "xlinkRole",
  "xlink:show": "xlinkShow",
  "xlink:title": "xlinkTitle",
  "xlink:type": "xlinkType",
  "xml:base": "xmlBase",
  "xml:lang": "xmlLang",
  "xml:space": "xmlSpace",
  "xmlns:xlink": "xmlnsXlink",
};

/**
 * Convert SVG attribute names from kebab-case to camelCase for JSX
 */
function convertSvgToCamelCase(svg: string): string {
  let result = svg;
  for (const [kebab, camel] of Object.entries(SVG_ATTR_CAMEL_CASE_MAP)) {
    // Match attribute="value" or attribute='value' patterns
    const regex = new RegExp(`(\\s)${kebab}(=)`, "g");
    result = result.replace(regex, `$1${camel}$2`);
  }
  return result;
}

interface OptimizationStats {
  originalSize: number;
  optimizedSize: number;
  savedBytes: number;
  savedPercent: string;
}

interface OptimizeResponse {
  success: boolean;
  result?: string;
  optimization?: OptimizationStats;
  error?: string;
}

// Get Monaco language for format
type EditorLanguage = "xml" | "javascript" | "typescript" | "html";

function getLanguageForFormat(format: OutputFormat): EditorLanguage {
  switch (format) {
    case "react":
      return "typescript";
    case "vue":
      return "html"; // Vue SFC is closest to HTML in Monaco
    case "svelte":
      return "html"; // Svelte is closest to HTML in Monaco
    case "web-component":
      return "typescript";
    default:
      return "xml";
  }
}

export default function EditorPage() {
  const [inputSvg, setInputSvg] = useState(SAMPLE_SVG);
  const [outputSvg, setOutputSvg] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [stats, setStats] = useState<OptimizationStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("svg");
  const [copied, setCopied] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSampleSelect = (sample: SampleSvg) => {
    setInputSvg(sample.content);
  };

  const handleFileDrop = (content: string) => {
    setInputSvg(content);
  };

  const handleCopyOutput = async () => {
    if (!formattedOutput || error) return;

    try {
      await navigator.clipboard.writeText(formattedOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Generate formatted output based on selected format
  const formattedOutput = useMemo(() => {
    if (!outputSvg || error) return outputSvg;

    const componentName = filenameToComponentName("SvgIcon.svg");
    // Convert to camelCase only for component formats (not raw SVG)
    const camelCaseSvg = convertSvgToCamelCase(outputSvg);

    try {
      switch (outputFormat) {
        case "react": {
          const result = generateReactComponent(camelCaseSvg, { componentName });
          return result.code;
        }
        case "vue": {
          const result = generateVueComponent(camelCaseSvg, { componentName });
          return result.code;
        }
        case "svelte": {
          const result = generateSvelteComponent(camelCaseSvg, { componentName });
          return result.code;
        }
        case "web-component": {
          const result = generateWebComponent(camelCaseSvg, { componentName });
          return result.code;
        }
        default:
          // Raw SVG - keep original kebab-case attributes for browser compatibility
          return outputSvg;
      }
    } catch {
      return outputSvg;
    }
  }, [outputSvg, outputFormat, error]);

  // Global paste handler for SVG content
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Only handle paste if not in an input/textarea/editor
      const target = e.target as HTMLElement;
      const isEditorOrInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.closest(".monaco-editor") !== null;

      if (isEditorOrInput) {
        // Let the element handle its own paste
        return;
      }

      const text = e.clipboardData?.getData("text/plain");
      if (text && (text.includes("<svg") || text.includes("<?xml"))) {
        e.preventDefault();
        setInputSvg(text);
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  // Auto-optimize when input changes (debounced)
  useEffect(() => {
    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const trimmedInput = inputSvg.trim();

    // Only optimize if input looks like SVG
    if (!trimmedInput || (!trimmedInput.startsWith("<svg") && !trimmedInput.startsWith("<?xml"))) {
      setOutputSvg("");
      setStats(null);
      setError(null);
      return;
    }

    // Set loading state
    setIsOptimizing(true);

    // Debounce the optimization
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch("/api/public/optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: trimmedInput, camelCase: false }),
          signal: controller.signal,
        });

        const data: OptimizeResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Optimization failed");
        }

        setOutputSvg(data.result || "");
        setStats(data.optimization || null);
        setError(null);
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        setError(err instanceof Error ? err.message : "Optimization failed");
        setOutputSvg("");
        setStats(null);
      } finally {
        setIsOptimizing(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputSvg]);

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* Header */}
      <header className="border-b border-[rgb(var(--border))] px-6 py-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[rgb(var(--secondary))] to-[rgb(var(--primary))] rounded-lg flex items-center justify-center">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">SVG Editor</h1>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">
                  Advanced SVG optimization with Monaco Editor
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <SampleSelector onSelect={handleSampleSelect} />
            <FormatSelector value={outputFormat} onChange={setOutputFormat} />
            {isOptimizing && (
              <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted-foreground))]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Optimizing...
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content - Split pane layout */}
      <main className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Input panel */}
          <Card className="flex flex-col">
            <CardHeader className="flex-shrink-0 pb-2">
              <CardTitle className="text-lg">Input SVG</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
              {/* Dropzone for file upload */}
              <Dropzone onFileDrop={handleFileDrop} />
              {/* Monaco Editor for input */}
              <div className="flex-1 min-h-0 border border-[rgb(var(--border))] rounded-lg overflow-hidden">
                <SvgCodeEditor value={inputSvg} onChange={setInputSvg} language="xml" />
              </div>
              {/* SVG Preview for input */}
              <div className="h-48 border border-[rgb(var(--border))] rounded-lg overflow-hidden">
                <SvgPreview svg={inputSvg} label="Input Preview" />
              </div>
            </CardContent>
          </Card>

          {/* Output panel */}
          <Card className="flex flex-col">
            <CardHeader className="flex-shrink-0 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Optimized Output</CardTitle>
                <div className="flex items-center gap-2">
                  <ExportDropdown svg={outputSvg} disabled={!outputSvg || !!error} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyOutput}
                    disabled={!formattedOutput || !!error}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
              {/* Monaco Editor for output (read-only) */}
              <div className="flex-1 min-h-0 border border-[rgb(var(--border))] rounded-lg overflow-hidden relative">
                {isOptimizing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
                <SvgCodeEditor
                  value={
                    formattedOutput ||
                    (error ? `// Error: ${error}` : "// Optimized SVG will appear here...")
                  }
                  readOnly
                  language={getLanguageForFormat(outputFormat)}
                />
              </div>
              {/* SVG Preview for output */}
              <div className="h-48 border border-[rgb(var(--border))] rounded-lg overflow-hidden">
                <SvgPreview svg={outputSvg} label="Output Preview" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats panel */}
        <div className="mt-4 p-4 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--card))]">
          {stats ? (
            <div className="flex items-center gap-6 text-sm">
              <span className="text-[rgb(var(--muted-foreground))]">
                Original: {stats.originalSize} bytes
              </span>
              <span className="text-[rgb(var(--muted-foreground))]">
                Optimized: {stats.optimizedSize} bytes
              </span>
              <span className="text-emerald-500 font-medium">
                Saved: {stats.savedBytes} bytes ({stats.savedPercent})
              </span>
            </div>
          ) : (
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              Optimization stats will appear here after processing
            </p>
          )}
        </div>

        {/* Validation panel */}
        <div className="mt-4 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--card))]">
          <ValidationPanel svg={inputSvg} />
        </div>
      </main>
    </div>
  );
}
