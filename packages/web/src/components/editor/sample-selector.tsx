"use client";

import { useState } from "react";
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

export function SampleSelector({ onSelect }: SampleSelectorProps) {
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
          Samples
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {SAMPLE_SVGS.map((sample) => (
          <DropdownMenuItem
            key={sample.id}
            onClick={() => handleSelect(sample)}
            className="flex flex-col items-start gap-1 cursor-pointer"
          >
            <span className="font-medium">{sample.name}</span>
            <span className="text-xs text-[rgb(var(--muted-foreground))]">
              {sample.description}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
