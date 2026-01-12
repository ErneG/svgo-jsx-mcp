import { useState, useCallback } from "react";
import { Copy, Check, Trash2, Clock, FileCode, ChevronDown, ChevronUp } from "lucide-react";
import type { HistoryItem, OutputFormat } from "@/types";

interface HistoryProps {
  history: HistoryItem[];
  onCopy: (content: string) => Promise<void>;
  onClear: () => void;
  onReOptimize: (svg: string) => void;
}

const FORMAT_LABELS: Record<OutputFormat, string> = {
  svg: "SVG",
  react: "React",
  vue: "Vue",
  svelte: "Svelte",
  "web-component": "Web Component",
};

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than 1 minute
  if (diff < 60000) {
    return "Just now";
  }

  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }

  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }

  // Same year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function HistoryItemCard({
  item,
  onCopy,
  onReOptimize,
}: {
  item: HistoryItem;
  onCopy: (content: string) => Promise<void>;
  onReOptimize: (svg: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = useCallback(async () => {
    await onCopy(item.optimizedSvg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [item.optimizedSvg, onCopy]);

  // Get SVG preview from original (truncated for performance)
  const previewSvg = item.originalSvg
    .replace(/width="[^"]*"/g, 'width="100%"')
    .replace(/height="[^"]*"/g, 'height="100%"');

  return (
    <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        {/* Preview */}
        <div
          className="w-10 h-10 rounded border border-[hsl(var(--border))] bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden flex-shrink-0"
          dangerouslySetInnerHTML={{ __html: previewSvg }}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <FileCode className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
            <span className="font-medium">{FORMAT_LABELS[item.format]}</span>
            <span className="text-green-600 dark:text-green-400 text-xs">{item.savedPercent}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
            <Clock className="w-3 h-3" />
            {formatTime(item.timestamp)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className={`
              flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors
              ${
                copied
                  ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
                  : "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800"
              }
            `}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded hover:bg-[hsl(var(--secondary))] transition-colors"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded View */}
      {expanded && (
        <div className="border-t border-[hsl(var(--border))] p-3 bg-[hsl(var(--secondary))]">
          <pre className="text-xs font-mono overflow-auto max-h-32 mb-2">
            <code>
              {item.optimizedSvg.slice(0, 500)}
              {item.optimizedSvg.length > 500 ? "..." : ""}
            </code>
          </pre>
          <button
            onClick={() => onReOptimize(item.originalSvg)}
            className="text-xs text-blue-500 hover:text-blue-600"
          >
            Re-optimize with different format →
          </button>
        </div>
      )}
    </div>
  );
}

export function History({ history, onCopy, onClear, onReOptimize }: HistoryProps) {
  if (history.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[hsl(var(--muted-foreground))] gap-2">
        <Clock className="w-8 h-8" />
        <p className="text-sm">No history yet</p>
        <p className="text-xs">Optimized SVGs will appear here</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-[hsl(var(--muted-foreground))]">
          {history.length} item{history.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={onClear}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto space-y-2">
        {history.map((item) => (
          <HistoryItemCard key={item.id} item={item} onCopy={onCopy} onReOptimize={onReOptimize} />
        ))}
      </div>
    </div>
  );
}
