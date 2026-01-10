export interface SampleSvg {
  id: string;
  name: string;
  description: string;
  content: string;
}

export const SAMPLE_SVGS: SampleSvg[] = [
  {
    id: "layers",
    name: "Layers Icon",
    description: "Simple layered icon",
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <path fill="currentColor" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
</svg>`,
  },
  {
    id: "heart",
    name: "Heart Icon",
    description: "Filled heart shape",
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <path fill="#e11d48" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
</svg>`,
  },
  {
    id: "star",
    name: "Star Icon",
    description: "5-point star",
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <polygon fill="#fbbf24" points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
</svg>`,
  },
  {
    id: "circle-pattern",
    name: "Circle Pattern",
    description: "Overlapping circles",
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="30" cy="30" r="25" fill="#3b82f6" opacity="0.6"/>
  <circle cx="70" cy="30" r="25" fill="#10b981" opacity="0.6"/>
  <circle cx="50" cy="65" r="25" fill="#f59e0b" opacity="0.6"/>
</svg>`,
  },
  {
    id: "complex-logo",
    name: "Complex Logo",
    description: "Logo with gradients and effects",
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect x="20" y="20" width="160" height="160" rx="20" fill="url(#grad1)" filter="url(#shadow)"/>
  <text x="100" y="115" font-family="Arial" font-size="48" font-weight="bold" fill="white" text-anchor="middle">SVG</text>
</svg>`,
  },
  {
    id: "check-badge",
    name: "Check Badge",
    description: "Verification badge with checkmark",
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
  <path d="m9 12 2 2 4-4"/>
</svg>`,
  },
  {
    id: "arrow-group",
    name: "Arrow Group",
    description: "Multiple directional arrows",
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <path d="M50 10 L70 30 L60 30 L60 50 L40 50 L40 30 L30 30 Z" fill="#22c55e"/>
  <path d="M90 50 L70 70 L70 60 L50 60 L50 40 L70 40 L70 30 Z" fill="#3b82f6" transform="rotate(90 70 50)"/>
  <path d="M50 90 L30 70 L40 70 L40 50 L60 50 L60 70 L70 70 Z" fill="#ef4444"/>
</svg>`,
  },
  {
    id: "weather-icon",
    name: "Weather Icon",
    description: "Sun and cloud",
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <circle cx="26" cy="26" r="12" fill="#fbbf24"/>
  <path d="M26 8v6M26 38v6M8 26h6M38 26h6M14.1 14.1l4.2 4.2M33.7 33.7l4.2 4.2M33.7 14.1l-4.2 4.2M14.1 33.7l4.2-4.2" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>
  <path d="M46 44a10 10 0 1 0-10-10c0 .3 0 .6.1.9A8 8 0 1 0 28 50h18a8 8 0 0 0 0-16z" fill="#94a3b8"/>
</svg>`,
  },
  {
    id: "loading-spinner",
    name: "Loading Spinner",
    description: "Animated loading indicator",
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50" height="50">
  <circle cx="25" cy="25" r="20" fill="none" stroke="#e5e7eb" stroke-width="4"/>
  <circle cx="25" cy="25" r="20" fill="none" stroke="#8b5cf6" stroke-width="4" stroke-linecap="round" stroke-dasharray="31.416 94.248" transform="rotate(-90 25 25)">
    <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/>
  </circle>
</svg>`,
  },
  {
    id: "chart-bars",
    name: "Bar Chart",
    description: "Simple bar chart visualization",
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80">
  <rect x="10" y="50" width="20" height="25" fill="#3b82f6" rx="2"/>
  <rect x="35" y="35" width="20" height="40" fill="#3b82f6" rx="2"/>
  <rect x="60" y="20" width="20" height="55" fill="#3b82f6" rx="2"/>
  <rect x="85" y="40" width="20" height="35" fill="#3b82f6" rx="2"/>
  <line x1="5" y1="75" x2="115" y2="75" stroke="#94a3b8" stroke-width="2"/>
</svg>`,
  },
];

export function getSampleById(id: string): SampleSvg | undefined {
  return SAMPLE_SVGS.find((sample) => sample.id === id);
}
