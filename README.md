# svgo-jsx-mcp

An MCP (Model Context Protocol) server for SVG optimization with JSX-compatible camelCase attribute conversion.

## Features

- **SVG Optimization**: Uses [SVGO](https://github.com/svg/svgo) to reduce SVG file sizes
- **CamelCase Conversion**: Converts kebab-case SVG attributes to camelCase for JSX/React compatibility (e.g., `stroke-width` → `strokeWidth`)
- **Configurable**: Toggle camelCase conversion on/off per request

## Installation

### Using npx (recommended)

```bash
npx svgo-jsx-mcp
```

### Manual installation

```bash
npm install -g svgo-jsx-mcp
```

## MCP Configuration

Add to your MCP settings:

```json
{
  "mcpServers": {
    "svgo-jsx": {
      "command": "npx",
      "args": ["-y", "svgo-jsx-mcp"]
    }
  }
}
```

## Tool: `optimize_svg`

Optimizes SVG content and optionally converts attributes to camelCase.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `content` | string | Yes | - | The SVG content to optimize |
| `filename` | string | No | "untitled.svg" | Optional filename for reporting |
| `camelCase` | boolean | No | `true` | Convert attributes to camelCase |

### Example Request

```json
{
  "content": "<svg stroke-width=\"2\" fill-opacity=\"0.5\">...</svg>",
  "filename": "icon.svg",
  "camelCase": true
}
```

### Example Response

```json
{
  "success": true,
  "filename": "icon.svg",
  "optimization": {
    "originalSize": 1234,
    "optimizedSize": 567,
    "savedBytes": 667,
    "savedPercent": "54.1%",
    "ratio": "0.459"
  },
  "camelCaseApplied": true,
  "result": "<svg strokeWidth=\"2\" fillOpacity=\"0.5\">...</svg>"
}
```

## CamelCase Conversion

When `camelCase` is `true` (default), kebab-case attributes are converted:

| Original | Converted |
|----------|-----------|
| `stroke-width` | `strokeWidth` |
| `fill-opacity` | `fillOpacity` |
| `font-size` | `fontSize` |
| `stroke-linecap` | `strokeLinecap` |
| `clip-path` | `clipPath` |

To disable conversion, set `camelCase: false` in your request.

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run
pnpm start
```

## License

MIT
