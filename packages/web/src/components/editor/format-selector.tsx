"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { OutputFormat } from "@svgo-jsx/shared";

interface FormatOption {
  value: OutputFormat;
  label: string;
  description: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    value: "svg",
    label: "Raw SVG",
    description: "Optimized SVG markup",
  },
  {
    value: "react",
    label: "React",
    description: "React functional component (TSX)",
  },
  {
    value: "vue",
    label: "Vue",
    description: "Vue 3 SFC with <script setup>",
  },
  {
    value: "svelte",
    label: "Svelte",
    description: "Svelte component",
  },
  {
    value: "web-component",
    label: "Web Component",
    description: "Vanilla Web Component (Custom Element)",
  },
];

interface FormatSelectorProps {
  value: OutputFormat;
  onChange: (format: OutputFormat) => void;
}

export function FormatSelector({ value, onChange }: FormatSelectorProps) {
  const selectedOption = FORMAT_OPTIONS.find((opt) => opt.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="min-w-[140px] justify-between">
          {selectedOption?.label || "Select Format"}
          <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px]">
        {FORMAT_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className={value === option.value ? "bg-[rgb(var(--accent))]" : ""}
          >
            <div className="flex flex-col">
              <span className="font-medium">{option.label}</span>
              <span className="text-xs text-[rgb(var(--muted-foreground))]">
                {option.description}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
