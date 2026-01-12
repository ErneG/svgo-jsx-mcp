import { useState, useEffect, useCallback } from "react";
import { Settings, Moon, Sun, Monitor, FileCode, Check, ExternalLink } from "lucide-react";
import { getStorageValue, setStorageValue } from "@/shared/storage";
import type { OutputFormat, StorageData } from "@/types";

const FORMATS: { value: OutputFormat; label: string; description: string }[] = [
  { value: "svg", label: "SVG", description: "Optimized SVG markup" },
  { value: "react", label: "React", description: "TypeScript React component" },
  { value: "vue", label: "Vue", description: "Vue 3 Single File Component" },
  { value: "svelte", label: "Svelte", description: "Svelte component" },
  { value: "web-component", label: "Web Component", description: "Vanilla Web Component" },
];

const THEMES: { value: StorageData["theme"]; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <Sun className="w-4 h-4" /> },
  { value: "dark", label: "Dark", icon: <Moon className="w-4 h-4" /> },
  { value: "system", label: "System", icon: <Monitor className="w-4 h-4" /> },
];

export function Options() {
  const [theme, setTheme] = useState<StorageData["theme"]>("system");
  const [defaultFormat, setDefaultFormat] = useState<OutputFormat>("react");
  const [saved, setSaved] = useState(false);

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      const savedTheme = await getStorageValue("theme");
      const savedFormat = await getStorageValue("defaultFormat");

      setTheme(savedTheme);
      setDefaultFormat(savedFormat);

      // Apply theme to document
      applyTheme(savedTheme);
    }

    loadSettings();
  }, []);

  const applyTheme = (newTheme: StorageData["theme"]) => {
    const isDark =
      newTheme === "dark" ||
      (newTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.documentElement.classList.toggle("dark", isDark);
  };

  const showSaved = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, []);

  const handleThemeChange = useCallback(
    async (newTheme: StorageData["theme"]) => {
      setTheme(newTheme);
      await setStorageValue("theme", newTheme);
      applyTheme(newTheme);
      showSaved();
    },
    [showSaved]
  );

  const handleFormatChange = useCallback(
    async (newFormat: OutputFormat) => {
      setDefaultFormat(newFormat);
      await setStorageValue("defaultFormat", newFormat);
      showSaved();
    },
    [showSaved]
  );

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <div className="max-w-2xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
            <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">SVGO JSX Settings</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Configure your extension preferences
            </p>
          </div>

          {/* Saved indicator */}
          {saved && (
            <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 text-sm">
              <Check className="w-4 h-4" />
              Saved
            </div>
          )}
        </div>

        {/* Settings Sections */}
        <div className="space-y-8">
          {/* Theme Setting */}
          <section className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
            <h2 className="text-lg font-semibold mb-1">Theme</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
              Choose how the extension looks
            </p>

            <div className="grid grid-cols-3 gap-3">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => handleThemeChange(t.value)}
                  className={`
                    flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all
                    ${
                      theme === t.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-[hsl(var(--border))] hover:border-blue-300"
                    }
                  `}
                >
                  {t.icon}
                  <span className="font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Default Format Setting */}
          <section className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
            <div className="flex items-center gap-2 mb-1">
              <FileCode className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Default Output Format</h2>
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
              Choose the default format when optimizing SVGs
            </p>

            <div className="space-y-2">
              {FORMATS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => handleFormatChange(f.value)}
                  className={`
                    w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left
                    ${
                      defaultFormat === f.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-[hsl(var(--border))] hover:border-blue-300"
                    }
                  `}
                >
                  <div>
                    <p className="font-medium">{f.label}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">{f.description}</p>
                  </div>
                  {defaultFormat === f.value && (
                    <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Keyboard Shortcuts Info */}
          <section className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
            <h2 className="text-lg font-semibold mb-1">Keyboard Shortcuts</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
              Quick access to extension features
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--secondary))]">
                <span>Optimize from clipboard</span>
                <kbd className="px-2 py-1 rounded bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm font-mono">
                  Alt+Shift+O
                </kbd>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--secondary))]">
                <span>Scan page for SVGs</span>
                <kbd className="px-2 py-1 rounded bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm font-mono">
                  Alt+Shift+S
                </kbd>
              </div>
            </div>

            <a
              href="chrome://extensions/shortcuts"
              onClick={(e) => {
                e.preventDefault();
                chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
              }}
              className="inline-flex items-center gap-1.5 mt-4 text-sm text-blue-500 hover:text-blue-600"
            >
              <ExternalLink className="w-4 h-4" />
              Customize shortcuts
            </a>
          </section>

          {/* About */}
          <section className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
            <h2 className="text-lg font-semibold mb-1">About</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
              SVGO JSX - SVG Optimizer Extension
            </p>

            <div className="space-y-2 text-sm">
              <p>
                <span className="text-[hsl(var(--muted-foreground))]">Version:</span> 1.0.0
              </p>
              <p>
                <span className="text-[hsl(var(--muted-foreground))]">
                  Optimize SVGs and generate
                </span>{" "}
                React, Vue, Svelte, and Web Component code.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
