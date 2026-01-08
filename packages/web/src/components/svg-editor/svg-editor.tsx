"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Upload, Download, Copy, Check, Loader2, RefreshCw } from "lucide-react";
import { cn, formatBytes, copyToClipboard, downloadFile } from "@/lib/utils";
import type { OptimizeSvgResponse } from "@svgo-jsx/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function SvgEditor() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<OptimizeSvgResponse | null>(null);
  const [camelCase, setCamelCase] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"input" | "output" | null>(null);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-optimize when input or camelCase changes (debounced)
  useEffect(() => {
    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const trimmedInput = input.trim();

    // Only optimize if input looks like SVG
    if (!trimmedInput || (!trimmedInput.startsWith("<svg") && !trimmedInput.startsWith("<?xml"))) {
      setOutput(null);
      setError(null);
      return;
    }

    // Debounce the optimization
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch(`${API_URL}/public/optimize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: input, camelCase }),
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Optimization failed");
        }

        setOutput(data);
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [input, camelCase]);

  const handleOptimize = useCallback(async () => {
    if (!input.trim()) return;

    // Cancel any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(`${API_URL}/public/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input, camelCase }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Optimization failed");
      }

      setOutput(data);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [input, camelCase]);

  const handleCopy = useCallback(async (type: "input" | "output") => {
    const text = type === "input" ? input : output?.result;
    if (!text) return;

    await copyToClipboard(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }, [input, output]);

  const handleDownload = useCallback(() => {
    if (!output?.result) return;
    const filename = output.filename || "optimized.svg";
    downloadFile(output.result, filename);
  }, [output]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = (event) => {
        setInput(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setInput(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">SVGO JSX</h1>
              <p className="text-sm text-gray-400">SVG Optimizer with JSX Support</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={camelCase}
                onChange={(e) => setCamelCase(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-violet-500 focus:ring-violet-500"
              />
              <span className="text-sm">Convert to camelCase</span>
            </label>

            <button
              onClick={handleOptimize}
              disabled={!input.trim() || isLoading}
              className={cn(
                "px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors",
                input.trim() && !isLoading
                  ? "bg-violet-600 hover:bg-violet-500 text-white"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Optimize
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input panel */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-gray-300">Input SVG</h2>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".svg"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <span className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 rounded-md transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload
                  </span>
                </label>
                <button
                  onClick={() => handleCopy("input")}
                  disabled={!input}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
                >
                  {copied === "input" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Copy
                </button>
              </div>
            </div>
            <div
              className="relative flex-1 min-h-[400px]"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste your SVG here or drag & drop a file..."
                className="w-full h-full min-h-[400px] p-4 bg-gray-900 border border-gray-800 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            {input && (
              <div className="mt-2 text-sm text-gray-500">
                Size: {formatBytes(new Blob([input]).size)}
              </div>
            )}
          </div>

          {/* Output panel */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-gray-300">Optimized Output</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!output?.result}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => handleCopy("output")}
                  disabled={!output?.result}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
                >
                  {copied === "output" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Copy
                </button>
              </div>
            </div>
            <div className="relative flex-1 min-h-[400px]">
              <textarea
                value={output?.result || ""}
                readOnly
                placeholder="Optimized SVG will appear here..."
                className="w-full h-full min-h-[400px] p-4 bg-gray-900 border border-gray-800 rounded-lg font-mono text-sm resize-none focus:outline-none"
              />
            </div>
            {output?.optimization && (
              <div className="mt-2 flex items-center gap-4 text-sm">
                <span className="text-gray-500">
                  Size: {formatBytes(output.optimization.optimizedSize)}
                </span>
                <span className="text-green-400">
                  Saved: {formatBytes(output.optimization.savedBytes)} ({output.optimization.savedPercent})
                </span>
                {output.camelCaseApplied && (
                  <span className="text-violet-400">camelCase applied</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        {(input || output?.result) && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-300 mb-2">Input Preview</h3>
              <div className="bg-white rounded-lg p-4 flex items-center justify-center min-h-[200px]">
                {input && (
                  <div
                    className="max-w-full max-h-[200px] [&>svg]:max-w-full [&>svg]:max-h-[200px]"
                    dangerouslySetInnerHTML={{ __html: input }}
                  />
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-300 mb-2">Output Preview</h3>
              <div className="bg-white rounded-lg p-4 flex items-center justify-center min-h-[200px]">
                {output?.result && (
                  <div
                    className="max-w-full max-h-[200px] [&>svg]:max-w-full [&>svg]:max-h-[200px]"
                    dangerouslySetInnerHTML={{ __html: output.result }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-4 mt-8">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          Powered by SVGO &bull; <a href="/admin" className="text-violet-400 hover:text-violet-300">Admin</a>
        </div>
      </footer>
    </div>
  );
}
