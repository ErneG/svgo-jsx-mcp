import { useState, useEffect, useCallback } from "react";
import { Copy, Check, Upload, Sparkles, FileCode, Moon, Sun, X } from "lucide-react";
import { optimizeSvg } from "@/shared/optimizer";
import { getStorageValue, setStorageValue, addToHistory } from "@/shared/storage";
import type { OutputFormat, OptimizationResult } from "@/types";

// Check if running in Chrome extension context
const isExtensionContext = typeof chrome !== "undefined" && chrome.runtime?.id;

const FORMATS: { value: OutputFormat; label: string; extension: string }[] = [
  { value: "svg", label: "SVG", extension: ".svg" },
  { value: "react", label: "React", extension: ".tsx" },
  { value: "vue", label: "Vue", extension: ".vue" },
  { value: "svelte", label: "Svelte", extension: ".svelte" },
  { value: "web-component", label: "Web Component", extension: ".js" },
];

export function Popup() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [format, setFormat] = useState<OutputFormat>("react");
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleOptimize = useCallback(async (svgContent: string, outputFormat: OutputFormat) => {
    if (!svgContent.trim()) {
      setError("Please paste or drop an SVG");
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Optimization failed");
      setOutput("");
      setResult(null);
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  const handleCopy = useCallback(async () => {
    if (!output) return;

    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  }, [output]);

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

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
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

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
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
            {(result.originalSize / 1024).toFixed(1)}KB → {(result.optimizedSize / 1024).toFixed(1)}
            KB
          </span>
          <span className="font-medium">{result.savedPercent} smaller</span>
        </div>
      )}
    </div>
  );
}
