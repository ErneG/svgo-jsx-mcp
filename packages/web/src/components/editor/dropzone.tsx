"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Upload, FileWarning, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DropzoneProps {
  onFileDrop: (content: string, filename: string) => void;
  onMultipleFiles?: (files: Array<{ content: string; filename: string }>) => void;
  className?: string;
}

interface FileError {
  filename: string;
  error: string;
}

export function Dropzone({ onFileDrop, onMultipleFiles, className = "" }: DropzoneProps) {
  const t = useTranslations();
  const [isDragOver, setIsDragOver] = useState(false);
  const [errors, setErrors] = useState<FileError[]>([]);
  const [pendingFiles, setPendingFiles] = useState<Array<{ content: string; filename: string }>>(
    []
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File): Promise<{ content: string; filename: string } | FileError> => {
      // Check file type
      if (!file.type.includes("svg") && !file.name.toLowerCase().endsWith(".svg")) {
        return { filename: file.name, error: "Not an SVG file" };
      }

      // Check file size (max 500KB)
      if (file.size > 500 * 1024) {
        return { filename: file.name, error: "File too large (max 500KB)" };
      }

      try {
        const content = await file.text();
        // Basic SVG validation
        if (!content.includes("<svg") && !content.includes("<?xml")) {
          return { filename: file.name, error: "Invalid SVG content" };
        }
        return { content, filename: file.name };
      } catch {
        return { filename: file.name, error: "Failed to read file" };
      }
    },
    []
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const results = await Promise.all(fileArray.map(processFile));

      const successes: Array<{ content: string; filename: string }> = [];
      const failures: FileError[] = [];

      results.forEach((result) => {
        if ("error" in result) {
          failures.push(result);
        } else {
          successes.push(result);
        }
      });

      setErrors(failures);

      if (successes.length === 1) {
        // Single file - load directly
        onFileDrop(successes[0].content, successes[0].filename);
        setPendingFiles([]);
      } else if (successes.length > 1) {
        // Multiple files - show selection
        if (onMultipleFiles) {
          setPendingFiles(successes);
        } else {
          // No multi-file handler, just load the first one
          onFileDrop(successes[0].content, successes[0].filename);
          setPendingFiles([]);
        }
      }
    },
    [onFileDrop, onMultipleFiles, processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFiles(files);
      }
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [handleFiles]
  );

  const handleSelectFile = useCallback(
    (file: { content: string; filename: string }) => {
      onFileDrop(file.content, file.filename);
      setPendingFiles([]);
      setErrors([]);
    },
    [onFileDrop]
  );

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const clearPending = useCallback(() => {
    setPendingFiles([]);
  }, []);

  return (
    <div className={className}>
      {/* Main dropzone area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-lg border-2 border-dashed p-6
          transition-all duration-200 ease-in-out
          ${
            isDragOver
              ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10"
              : "border-[rgb(var(--border))] hover:border-[rgb(var(--primary))]/50 hover:bg-[rgb(var(--muted))]/30"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg,image/svg+xml"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2 text-center">
          <Upload
            className={`h-8 w-8 ${
              isDragOver ? "text-[rgb(var(--primary))]" : "text-[rgb(var(--muted-foreground))]"
            }`}
          />
          <p className="text-sm font-medium">{t("editor.dropzone.title")}</p>
          <p className="text-xs text-[rgb(var(--muted-foreground))]">
            {t("editor.dropzone.subtitle")}
          </p>
        </div>
      </div>

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-red-500">
              <FileWarning className="h-4 w-4" />
              <span className="text-sm font-medium">Some files could not be loaded</span>
            </div>
            <Button variant="ghost" size="sm" onClick={clearErrors} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ul className="text-xs text-red-400 space-y-1">
            {errors.map((err, i) => (
              <li key={i}>
                {err.filename}: {err.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Multiple file selection */}
      {pendingFiles.length > 1 && (
        <div className="mt-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Select a file to load:</span>
            <Button variant="ghost" size="sm" onClick={clearPending} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {pendingFiles.map((file, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => handleSelectFile(file)}
                className="text-xs"
              >
                {file.filename}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
