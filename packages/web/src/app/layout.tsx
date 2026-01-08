import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SVGO JSX - SVG Optimizer",
  description: "Optimize SVGs with JSX-compatible camelCase attribute conversion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
