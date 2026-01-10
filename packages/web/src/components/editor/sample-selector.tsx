"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SAMPLE_SVGS, type SampleSvg } from "@/lib/sample-svgs";

export interface SampleSelectorProps {
  onSelect: (sample: SampleSvg) => void;
}

// Map sample IDs to translation keys
const sampleTranslationKeys: Record<string, { name: string; desc: string }> = {
  layers: { name: "editor.samples.layersIcon", desc: "editor.samples.layersIconDesc" },
  heart: { name: "editor.samples.heartIcon", desc: "editor.samples.heartIconDesc" },
  star: { name: "editor.samples.starIcon", desc: "editor.samples.starIconDesc" },
  circles: { name: "editor.samples.circlePattern", desc: "editor.samples.circlePatternDesc" },
  logo: { name: "editor.samples.complexLogo", desc: "editor.samples.complexLogoDesc" },
  badge: { name: "editor.samples.checkBadge", desc: "editor.samples.checkBadgeDesc" },
  arrows: { name: "editor.samples.arrowGroup", desc: "editor.samples.arrowGroupDesc" },
  weather: { name: "editor.samples.weatherIcon", desc: "editor.samples.weatherIconDesc" },
  spinner: { name: "editor.samples.loadingSpinner", desc: "editor.samples.loadingSpinnerDesc" },
  chart: { name: "editor.samples.barChart", desc: "editor.samples.barChartDesc" },
};

export function SampleSelector({ onSelect }: SampleSelectorProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  const handleSelect = (sample: SampleSvg) => {
    onSelect(sample);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <FileImage className="h-4 w-4 mr-2" />
          {t("editor.samples")}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {SAMPLE_SVGS.map((sample) => {
          const keys = sampleTranslationKeys[sample.id];
          return (
            <DropdownMenuItem
              key={sample.id}
              onClick={() => handleSelect(sample)}
              className="flex flex-col items-start gap-1 cursor-pointer"
            >
              <span className="font-medium">{keys ? t(keys.name) : sample.name}</span>
              <span className="text-xs text-[rgb(var(--muted-foreground))]">
                {keys ? t(keys.desc) : sample.description}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
