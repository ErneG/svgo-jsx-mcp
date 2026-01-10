"use client";

import { useTranslations } from "next-intl";
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
  labelKey: string;
  description: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    value: "svg",
    labelKey: "editor.format.svg",
    description: "Optimized SVG markup",
  },
  {
    value: "react",
    labelKey: "editor.format.react",
    description: "React functional component (TSX)",
  },
  {
    value: "vue",
    labelKey: "editor.format.vue",
    description: "Vue 3 SFC with <script setup>",
  },
  {
    value: "svelte",
    labelKey: "editor.format.svelte",
    description: "Svelte component",
  },
  {
    value: "web-component",
    labelKey: "editor.format.webComponent",
    description: "Vanilla Web Component (Custom Element)",
  },
];

interface FormatSelectorProps {
  value: OutputFormat;
  onChange: (format: OutputFormat) => void;
}

export function FormatSelector({ value, onChange }: FormatSelectorProps) {
  const t = useTranslations();
  const selectedOption = FORMAT_OPTIONS.find((opt) => opt.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="min-w-[140px] justify-between">
          {selectedOption ? t(selectedOption.labelKey) : t("editor.format.svg")}
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
              <span className="font-medium">{t(option.labelKey)}</span>
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
