"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import {
  validateSvg,
  type ValidationIssue,
  type ValidationSeverity,
} from "@svgo-jsx/shared/validator";

interface ValidationPanelProps {
  svg: string;
  className?: string;
}

const severityConfig: Record<
  ValidationSeverity,
  { icon: typeof AlertCircle; color: string; bgColor: string; labelKey: string }
> = {
  error: {
    icon: AlertCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    labelKey: "validation.severity.error",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    labelKey: "validation.severity.warning",
  },
  info: {
    icon: Info,
    color: "text-sky-500",
    bgColor: "bg-sky-500/10",
    labelKey: "validation.severity.info",
  },
};

function ValidationIssueItem({ issue, t }: { issue: ValidationIssue; t: (key: string) => string }) {
  const config = severityConfig[issue.severity];
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${config.bgColor}`}>
      <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.color}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${config.color}`}>{t(config.labelKey)}</span>
          <span className="text-xs text-[rgb(var(--muted-foreground))] font-mono">
            {issue.code}
          </span>
        </div>
        <p className="text-sm mt-0.5">{issue.message}</p>
        {issue.suggestion && (
          <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">{issue.suggestion}</p>
        )}
      </div>
    </div>
  );
}

export function ValidationPanel({ svg, className = "" }: ValidationPanelProps) {
  const t = useTranslations();
  const validation = useMemo(() => {
    if (!svg.trim()) {
      return null;
    }
    return validateSvg(svg);
  }, [svg]);

  if (!validation) {
    return (
      <div className={`p-4 text-center text-sm text-[rgb(var(--muted-foreground))] ${className}`}>
        {t("validation.title")}
      </div>
    );
  }

  const { issues, summary, valid } = validation;

  if (issues.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center gap-2 text-emerald-500">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">{t("validation.noIssues")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Summary */}
      <div className="flex items-center justify-between p-3 border-b border-[rgb(var(--border))]">
        <div className="flex items-center gap-2">
          {valid ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm font-medium">
            {t("validation.issuesFound", { count: issues.length })}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {summary.errors > 0 && (
            <span className="flex items-center gap-1 text-red-500">
              <AlertCircle className="h-3 w-3" />
              {summary.errors}
            </span>
          )}
          {summary.warnings > 0 && (
            <span className="flex items-center gap-1 text-amber-500">
              <AlertTriangle className="h-3 w-3" />
              {summary.warnings}
            </span>
          )}
          {summary.info > 0 && (
            <span className="flex items-center gap-1 text-sky-500">
              <Info className="h-3 w-3" />
              {summary.info}
            </span>
          )}
        </div>
      </div>

      {/* Issues list */}
      <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
        {/* Show errors first, then warnings, then info */}
        {issues
          .sort((a, b) => {
            const order = { error: 0, warning: 1, info: 2 };
            return order[a.severity] - order[b.severity];
          })
          .map((issue, index) => (
            <ValidationIssueItem key={`${issue.code}-${index}`} issue={issue} t={t} />
          ))}
      </div>
    </div>
  );
}
