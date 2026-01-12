import { useState, useEffect, useCallback } from "react";
import {
  Copy,
  Check,
  Upload,
  Sparkles,
  FileCode,
  Moon,
  Sun,
  X,
  Search,
  RefreshCw,
  CheckSquare,
  Square,
} from "lucide-react";
import { optimizeSvg } from "@/shared/optimizer";
import { getStorageValue, setStorageValue, addToHistory } from "@/shared/storage";
import { createToastId, TOAST_DURATIONS, type Toast } from "@/shared/toast";
import { ToastContainer } from "./Toast";
import type { OutputFormat, OptimizationResult, SVGInfo } from "@/types";

// Check if running in Chrome extension context
const isExtensionContext = typeof chrome !== "undefined" && chrome.runtime?.id;

const FORMATS: { value: OutputFormat; label: string; extension: string }[] = [
  { value: "svg", label: "SVG", extension: ".svg" },
  { value: "react", label: "React", extension: ".tsx" },
  { value: "vue", label: "Vue", extension: ".vue" },
  { value: "svelte", label: "Svelte", extension: ".svelte" },
  { value: "web-component", label: "Web Component", extension: ".js" },
];

type Tab = "optimize" | "scan";

export function Popup() {
  const [activeTab, setActiveTab] = useState<Tab>("optimize");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [format, setFormat] = useState<OutputFormat>("react");
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scannedSvgs, setScannedSvgs] = useState<SVGInfo[]>([]);
  const [selectedSvgs, setSelectedSvgs] = useState<Set<string>>(new Set());

  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast["type"], message: string) => {
    const toast: Toast = {
      id: createToastId(),
      type,
      message,
      duration: TOAST_DURATIONS[type],
    };
    setToasts((prev) => [...prev, toast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load preferences on mount
  useEffect(() => {
    async function loadPreferences() {
      // Use system preference as fallback when not in extension context
      if (!isExtensionContext) {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          setIsDark(true);
          document.documentElement.classList.add("dark");
        }
        return;
      }

      const theme = await getStorageValue("theme");
      const defaultFormat = await getStorageValue("defaultFormat");

      if (
        theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
      ) {
        setIsDark(true);
        document.documentElement.classList.add("dark");
      }

      if (defaultFormat) {
        setFormat(defaultFormat);
      }

      // Check for pending optimization from context menu
      const storage = await chrome.storage.local.get("pendingOptimization");
      if (storage.pendingOptimization) {
        setInput(storage.pendingOptimization.svg);
        setFormat(storage.pendingOptimization.format);
        await chrome.storage.local.remove("pendingOptimization");
        // Trigger optimization
        handleOptimize(storage.pendingOptimization.svg, storage.pendingOptimization.format);
      }
    }

    loadPreferences();
  }, []);

  // Listen for messages from background script (only in extension context)
  useEffect(() => {
    if (!isExtensionContext) return;

    function handleMessage(message: { type: string }) {
      if (message.type === "PASTE_AND_OPTIMIZE") {
        navigator.clipboard.readText().then((text) => {
          if (text.includes("<svg")) {
            setInput(text);
            handleOptimize(text, format);
          }
        });
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [format]);

  const handleOptimize = useCallback(
    async (svgContent: string, outputFormat: OutputFormat) => {
      if (!svgContent.trim()) {
        addToast("warning", "Please paste or drop an SVG");
        return;
      }

      setIsOptimizing(true);
      setError(null);

      try {
        const optimizationResult = optimizeSvg(svgContent, outputFormat);
        setResult(optimizationResult);
        setOutput(optimizationResult.output);

        // Save to history
        await addToHistory({
          originalSvg: svgContent,
          optimizedSvg: optimizationResult.output,
          format: outputFormat,
          savedPercent: optimizationResult.savedPercent,
        });

        addToast("success", `Optimized! ${optimizationResult.savedPercent} smaller`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Optimization failed";
        setError(errorMsg);
        addToast("error", errorMsg);
        setOutput("");
        setResult(null);
      } finally {
        setIsOptimizing(false);
      }
    },
    [addToast]
  );

  const handleCopy = useCallback(async () => {
    if (!output) return;

    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast("success", "Copied to clipboard!");
    } catch {
      addToast("error", "Failed to copy to clipboard");
    }
  }, [output, addToast]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type === "image/svg+xml") {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setInput(content);
          handleOptimize(content, format);
        };
        reader.readAsText(file);
      } else {
        // Try to get SVG from dropped text
        const text = e.dataTransfer.getData("text");
        if (text.includes("<svg")) {
          setInput(text);
          handleOptimize(text, format);
        }
      }
    },
    [format, handleOptimize]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const text = e.clipboardData.getData("text");
      if (text.includes("<svg")) {
        setInput(text);
        handleOptimize(text, format);
      }
    },
    [format, handleOptimize]
  );

  const toggleTheme = useCallback(async () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle("dark", newDark);
    await setStorageValue("theme", newDark ? "dark" : "light");
  }, [isDark]);

  const handleFormatChange = useCallback(
    async (newFormat: OutputFormat) => {
      setFormat(newFormat);
      await setStorageValue("defaultFormat", newFormat);

      // Re-optimize if we have input
      if (input) {
        handleOptimize(input, newFormat);
      }
    },
    [input, handleOptimize]
  );

  // Scanner functions
  const scanPage = useCallback(async () => {
    if (!isExtensionContext) {
      addToast("error", "Page scanning only works in extension context");
      return;
    }

    setIsScanning(true);
    setError(null);
    setScannedSvgs([]);
    setSelectedSvgs(new Set());

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        addToast("error", "No active tab found");
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, { type: "SCAN_PAGE" });
      if (response?.svgs) {
        setScannedSvgs(response.svgs);
        if (response.svgs.length === 0) {
          addToast("info", "No SVGs found on this page");
        } else {
          addToast("success", `Found ${response.svgs.length} SVG(s)`);
        }
      }
    } catch {
      addToast("error", "Failed to scan page. Try refreshing the page.");
    } finally {
      setIsScanning(false);
    }
  }, [addToast]);

  const toggleSvgSelection = useCallback((id: string) => {
    setSelectedSvgs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllSvgs = useCallback(() => {
    const allIds = scannedSvgs.filter((svg) => svg.content).map((svg) => svg.id);
    setSelectedSvgs(new Set(allIds));
  }, [scannedSvgs]);

  const deselectAllSvgs = useCallback(() => {
    setSelectedSvgs(new Set());
  }, []);

  const optimizeSelectedSvg = useCallback(
    (svg: SVGInfo) => {
      if (!svg.content) {
        addToast("error", "Cannot access this SVG due to CORS restrictions");
        return;
      }
      setInput(svg.content);
      setActiveTab("optimize");
      handleOptimize(svg.content, format);
    },
    [format, handleOptimize, addToast]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h1 className="font-semibold text-lg">SVGO JSX</h1>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 gap-1">
        <button
          onClick={() => setActiveTab("optimize")}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "optimize"
              ? "bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Optimize
          </span>
        </button>
        <button
          onClick={() => {
            setActiveTab("scan");
            if (scannedSvgs.length === 0 && !isScanning) {
              scanPage();
            }
          }}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "scan"
              ? "bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Search className="w-3.5 h-3.5" />
            Scan Page
            {scannedSvgs.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                {scannedSvgs.length}
              </span>
            )}
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 pt-2 gap-3 overflow-hidden">
        {activeTab === "optimize" ? (
          <>
            {/* Drop Zone / Input */}
            <div
              className={`
                relative flex-1 min-h-[120px] rounded-lg border-2 border-dashed transition-colors
                ${isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-[hsl(var(--border))]"}
                ${!input ? "cursor-pointer hover:border-blue-400" : ""}
              `}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !input && document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".svg,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const content = event.target?.result as string;
                      setInput(content);
                      handleOptimize(content, format);
                    };
                    reader.readAsText(file);
                  }
                }}
              />

              {!input ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[hsl(var(--muted-foreground))]">
                  <Upload className="w-8 h-8" />
                  <p className="text-sm">Drop SVG or click to upload</p>
                  <p className="text-xs">or paste SVG code (Ctrl+V)</p>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col">
                  <div className="flex items-center justify-between p-2 border-b border-[hsl(var(--border))]">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Input SVG</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInput("");
                        setOutput("");
                        setResult(null);
                        setError(null);
                      }}
                      className="p-1 rounded hover:bg-[hsl(var(--secondary))]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onPaste={handlePaste}
                    className="flex-1 p-2 text-xs font-mono bg-transparent resize-none focus:outline-none"
                    placeholder="Paste SVG code here..."
                  />
                </div>
              )}
            </div>

            {/* Format Selector */}
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <div className="flex flex-1 rounded-lg bg-[hsl(var(--secondary))] p-1 gap-1">
                {FORMATS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => handleFormatChange(f.value)}
                    className={`
                      flex-1 px-2 py-1.5 text-xs rounded-md transition-colors
                      ${
                        format === f.value
                          ? "bg-white dark:bg-[hsl(var(--background))] shadow-sm font-medium"
                          : "hover:bg-white/50 dark:hover:bg-white/10"
                      }
                    `}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optimize Button */}
            {input && !output && (
              <button
                onClick={() => handleOptimize(input, format)}
                disabled={isOptimizing}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {isOptimizing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Optimize
                  </>
                )}
              </button>
            )}

            {/* Output */}
            {output && (
              <div className="flex-1 min-h-[120px] rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-2 border-b border-[hsl(var(--border))]">
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    Output ({FORMATS.find((f) => f.value === format)?.extension})
                  </span>
                  <button
                    onClick={handleCopy}
                    className={`
                      flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors
                      ${
                        copied
                          ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
                          : "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800"
                      }
                    `}
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="flex-1 p-2 text-xs font-mono overflow-auto">
                  <code>{output}</code>
                </pre>
              </div>
            )}

            {/* Stats */}
            {result && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 text-sm">
                <span>
                  {(result.originalSize / 1024).toFixed(1)}KB →{" "}
                  {(result.optimizedSize / 1024).toFixed(1)}
                  KB
                </span>
                <span className="font-medium">{result.savedPercent} smaller</span>
              </div>
            )}
          </>
        ) : (
          /* Scanner Tab */
          <div className="flex-1 flex flex-col gap-3 overflow-hidden">
            {/* Scanner Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={scanPage}
                disabled={isScanning}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
                {isScanning ? "Scanning..." : "Rescan"}
              </button>

              {scannedSvgs.length > 0 && (
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={selectAllSvgs}
                    className="text-xs text-blue-500 hover:text-blue-600"
                  >
                    Select All
                  </button>
                  <span className="text-[hsl(var(--muted-foreground))]">|</span>
                  <button
                    onClick={deselectAllSvgs}
                    className="text-xs text-blue-500 hover:text-blue-600"
                  >
                    Deselect
                  </button>
                </div>
              )}
            </div>

            {/* SVG List */}
            <div className="flex-1 overflow-auto rounded-lg border border-[hsl(var(--border))]">
              {isScanning ? (
                <div className="flex items-center justify-center h-full text-[hsl(var(--muted-foreground))]">
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <p className="text-sm">Scanning page for SVGs...</p>
                  </div>
                </div>
              ) : scannedSvgs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-[hsl(var(--muted-foreground))]">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="w-6 h-6" />
                    <p className="text-sm">No SVGs found</p>
                    <p className="text-xs">Try scanning a different page</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-[hsl(var(--border))]">
                  {scannedSvgs.map((svg) => (
                    <div
                      key={svg.id}
                      className="flex items-center gap-3 p-3 hover:bg-[hsl(var(--secondary))] transition-colors"
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleSvgSelection(svg.id)}
                        className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                        disabled={!svg.content}
                      >
                        {selectedSvgs.has(svg.id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-500" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      {/* Preview */}
                      <div
                        className="w-10 h-10 rounded border border-[hsl(var(--border))] bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden"
                        dangerouslySetInnerHTML={
                          svg.content
                            ? {
                                __html: svg.content.replace(
                                  /<svg/,
                                  '<svg style="max-width:100%;max-height:100%"'
                                ),
                              }
                            : undefined
                        }
                      >
                        {!svg.content && (
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">?</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {svg.source === "inline"
                            ? "Inline SVG"
                            : svg.url?.split("/").pop() || "SVG"}
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          {svg.dimensions
                            ? `${Math.round(svg.dimensions.width)}×${Math.round(svg.dimensions.height)}`
                            : "Unknown size"}{" "}
                          • {svg.source}
                          {!svg.content && " • CORS blocked"}
                        </p>
                      </div>

                      {/* Optimize Button */}
                      <button
                        onClick={() => optimizeSelectedSvg(svg)}
                        disabled={!svg.content}
                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Optimize
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selection Info */}
            {selectedSvgs.size > 0 && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-sm">
                <span>{selectedSvgs.size} SVG(s) selected</span>
                <span className="text-xs">Batch download coming soon</span>
              </div>
            )}
          </div>
        )}

        {/* Error - shown in both tabs */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
