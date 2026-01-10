"use client";

import Link from "next/link";
import { Layers, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditorPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* Header */}
      <header className="border-b border-[rgb(var(--border))] px-6 py-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[rgb(var(--secondary))] to-[rgb(var(--primary))] rounded-lg flex items-center justify-center">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">SVG Editor</h1>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">
                  Advanced SVG optimization with Monaco Editor
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Format selector will go here (Task 2.5) */}
            {/* Theme toggle will go here (Task 3.5) */}
          </div>
        </div>
      </header>

      {/* Main content - Split pane layout */}
      <main className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Input panel */}
          <Card className="flex flex-col">
            <CardHeader className="flex-shrink-0 pb-2">
              <CardTitle className="text-lg">Input SVG</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
              {/* Monaco Editor placeholder - will be added in Task 1.3 */}
              <div className="flex-1 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--card))] flex items-center justify-center">
                <p className="text-[rgb(var(--muted-foreground))]">
                  Monaco Editor will be added here
                </p>
              </div>
              {/* SVG Preview placeholder - will be added in Task 1.5 */}
              <div className="h-48 border border-[rgb(var(--border))] rounded-lg bg-white flex items-center justify-center">
                <p className="text-gray-400">Input Preview</p>
              </div>
            </CardContent>
          </Card>

          {/* Output panel */}
          <Card className="flex flex-col">
            <CardHeader className="flex-shrink-0 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Optimized Output</CardTitle>
                {/* Copy/Download buttons will go here */}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
              {/* Monaco Editor placeholder (read-only) - will be added in Task 1.3 */}
              <div className="flex-1 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--card))] flex items-center justify-center">
                <p className="text-[rgb(var(--muted-foreground))]">
                  Optimized SVG will appear here
                </p>
              </div>
              {/* SVG Preview placeholder - will be added in Task 1.5 */}
              <div className="h-48 border border-[rgb(var(--border))] rounded-lg bg-white flex items-center justify-center">
                <p className="text-gray-400">Output Preview</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats panel placeholder - will be added in Task 1.7 */}
        <div className="mt-4 p-4 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--card))]">
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            Optimization stats will appear here after processing
          </p>
        </div>
      </main>
    </div>
  );
}
