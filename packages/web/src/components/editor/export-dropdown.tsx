"use client";

import { useState } from "react";
import { Download, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportDropdownProps {
  svg: string;
  disabled?: boolean;
}

type ExportFormat = "png" | "webp" | "jpeg";
type ExportScale = 1 | 2 | 3;

interface ExportOption {
  format: ExportFormat;
  scale: ExportScale;
  label: string;
}

const exportOptions: ExportOption[] = [
  { format: "png", scale: 1, label: "PNG (1x)" },
  { format: "png", scale: 2, label: "PNG (2x)" },
  { format: "png", scale: 3, label: "PNG (3x)" },
  { format: "webp", scale: 1, label: "WebP (1x)" },
  { format: "webp", scale: 2, label: "WebP (2x)" },
  { format: "webp", scale: 3, label: "WebP (3x)" },
  { format: "jpeg", scale: 1, label: "JPEG (1x)" },
  { format: "jpeg", scale: 2, label: "JPEG (2x)" },
];

export function ExportDropdown({ svg, disabled }: ExportDropdownProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingLabel, setExportingLabel] = useState("");

  const handleExport = async (option: ExportOption) => {
    if (!svg || isExporting) return;

    setIsExporting(true);
    setExportingLabel(option.label);

    try {
      const response = await fetch("/api/public/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: svg,
          format: option.format,
          scale: option.scale,
          quality: option.format === "jpeg" ? 90 : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }

      // Get the image blob
      const blob = await response.blob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `svg-export-${option.scale}x.${option.format === "jpeg" ? "jpg" : option.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
      setExportingLabel("");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || !svg || isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Export as Image
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs text-[rgb(var(--muted-foreground))] font-normal">
          PNG (Lossless)
        </DropdownMenuLabel>
        {exportOptions
          .filter((o) => o.format === "png")
          .map((option) => (
            <DropdownMenuItem
              key={`${option.format}-${option.scale}`}
              onClick={() => handleExport(option)}
              disabled={isExporting}
            >
              {isExporting && exportingLabel === option.label ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2 opacity-0" />
              )}
              {option.label}
            </DropdownMenuItem>
          ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-[rgb(var(--muted-foreground))] font-normal">
          WebP (Smaller size)
        </DropdownMenuLabel>
        {exportOptions
          .filter((o) => o.format === "webp")
          .map((option) => (
            <DropdownMenuItem
              key={`${option.format}-${option.scale}`}
              onClick={() => handleExport(option)}
              disabled={isExporting}
            >
              {isExporting && exportingLabel === option.label ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2 opacity-0" />
              )}
              {option.label}
            </DropdownMenuItem>
          ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-[rgb(var(--muted-foreground))] font-normal">
          JPEG (No transparency)
        </DropdownMenuLabel>
        {exportOptions
          .filter((o) => o.format === "jpeg")
          .map((option) => (
            <DropdownMenuItem
              key={`${option.format}-${option.scale}`}
              onClick={() => handleExport(option)}
              disabled={isExporting}
            >
              {isExporting && exportingLabel === option.label ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2 opacity-0" />
              )}
              {option.label}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
