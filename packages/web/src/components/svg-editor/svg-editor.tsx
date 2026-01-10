"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Upload,
  Download,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  Layers,
  Settings,
  Code2,
} from "lucide-react";
import { formatBytes, copyToClipboard, downloadFile } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

  const handleCopy = useCallback(
    async (type: "input" | "output") => {
      const text = type === "input" ? input : output?.result;
      if (!text) return;

      await copyToClipboard(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    },
    [input, output]
  );

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
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* Header */}
      <header className="border-b border-[rgb(var(--border))] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[rgb(var(--secondary))] to-[rgb(var(--primary))] rounded-lg flex items-center justify-center">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">SVGO JSX</h1>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">
                SVG Optimizer with JSX Support
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/editor">
              <Button variant="outline" size="sm">
                <Code2 className="h-4 w-4 mr-2" />
                Advanced Editor
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              <Switch id="camelCase" checked={camelCase} onCheckedChange={setCamelCase} />
              <Label htmlFor="camelCase" className="text-sm cursor-pointer">
                Convert to camelCase
              </Label>
            </div>

            <Button onClick={handleOptimize} disabled={!input.trim() || isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Optimize
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto p-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input panel */}
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--border))]">
                <h2 className="font-semibold">Input SVG</h2>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-8 px-3 hover:bg-[rgb(var(--accent))] hover:text-[rgb(var(--accent-foreground))] transition-colors">
                    <input
                      type="file"
                      accept=".svg"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Upload className="h-4 w-4" />
                    Upload
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy("input")}
                    disabled={!input}
                  >
                    {copied === "input" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    Copy
                  </Button>
                </div>
              </div>
              <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Paste your SVG here or drag & drop a file..."
                  className="w-full min-h-[400px] p-4 bg-transparent font-mono text-sm resize-none focus:outline-none border-none"
                />
              </div>
              {input && (
                <div className="px-4 pb-4 text-sm text-[rgb(var(--muted-foreground))]">
                  Size: {formatBytes(new Blob([input]).size)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Output panel */}
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--border))]">
                <h2 className="font-semibold">Optimized Output</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    disabled={!output?.result}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy("output")}
                    disabled={!output?.result}
                  >
                    {copied === "output" ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy
                  </Button>
                </div>
              </div>
              <textarea
                value={output?.result || ""}
                readOnly
                placeholder="Optimized SVG will appear here..."
                className="w-full min-h-[400px] p-4 bg-transparent font-mono text-sm resize-none focus:outline-none border-none"
              />
              {output?.optimization && (
                <div className="px-4 pb-4 flex items-center gap-4 text-sm">
                  <span className="text-[rgb(var(--muted-foreground))]">
                    Size: {formatBytes(output.optimization.optimizedSize)}
                  </span>
                  <span className="text-emerald-500">
                    Saved: {formatBytes(output.optimization.savedBytes)} (
                    {output.optimization.savedPercent})
                  </span>
                  {output.camelCaseApplied && (
                    <span className="text-[rgb(var(--primary))]">camelCase applied</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        {(input || output?.result) && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Input Preview</h3>
                <div className="bg-white rounded-lg p-4 flex items-center justify-center min-h-[200px]">
                  {input && (
                    <div
                      className="max-w-full max-h-[200px] [&>svg]:max-w-full [&>svg]:max-h-[200px]"
                      dangerouslySetInnerHTML={{ __html: input }}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Output Preview</h3>
                <div className="bg-white rounded-lg p-4 flex items-center justify-center min-h-[200px]">
                  {output?.result && (
                    <div
                      className="max-w-full max-h-[200px] [&>svg]:max-w-full [&>svg]:max-h-[200px]"
                      dangerouslySetInnerHTML={{ __html: output.result }}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[rgb(var(--border))] px-6 py-4 mt-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-[rgb(var(--muted-foreground))]">
          <span>Powered by SVGO</span>
          <div className="flex items-center gap-4">
            <Link
              href="/editor"
              className="flex items-center gap-1 hover:text-[rgb(var(--foreground))] transition-colors"
            >
              <Code2 className="h-4 w-4" />
              Advanced Editor
            </Link>
            <Link
              href="/admin"
              className="flex items-center gap-1 hover:text-[rgb(var(--foreground))] transition-colors"
            >
              <Settings className="h-4 w-4" />
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
