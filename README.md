# svgo-jsx-mcp

An MCP (Model Context Protocol) server for SVG optimization with JSX-compatible camelCase attribute conversion. Includes a production-ready HTTP API with authentication, rate limiting, and usage tracking.

## Features

- **SVG Optimization**: Uses [SVGO](https://github.com/svg/svgo) to reduce SVG file sizes
- **CamelCase Conversion**: Converts kebab-case SVG attributes to camelCase for JSX/React compatibility
- **API Key Authentication**: Secure access with database-backed API keys
- **Rate Limiting**: Configurable per-key rate limits
- **Usage Statistics**: Track optimization metrics and request history
- **Batch Processing**: Optimize multiple SVGs in a single request
- **Docker Ready**: Deploy to Coolify or any Docker host

## Quick Start

### Local Development (stdio mode)

```bash
npx svgo-jsx-mcp
```

### HTTP Server Mode

```bash
# Clone and install
git clone https://github.com/your-username/svgo-jsx-mcp
cd svgo-jsx-mcp
pnpm install

# Set up database
cp .env.example .env
# Edit .env with your DATABASE_URL and API_KEYS

# Run migrations and start
pnpm prisma migrate dev
pnpm dev
```

## Deployment (Coolify/Docker)

### Docker Compose

```bash
# Set your API keys
export API_KEYS=your-secret-key-here

# Start services
docker-compose up -d
```

### Coolify Deployment

1. Create a new service from this GitHub repo
2. Add a PostgreSQL database
3. Set environment variables:
   - `DATABASE_URL`: Connection string to your PostgreSQL
   - `API_KEYS`: Comma-separated list of API keys
   - `PORT`: 3000 (default)
4. Deploy

## API Endpoints

### Health Check
```
GET /health
```
No authentication required. Returns server and database status.

### Optimize SVG
```
POST /mcp/optimize
Authorization: Bearer <api-key>

{
  "content": "<svg>...</svg>",
  "filename": "icon.svg",
  "camelCase": true
}
```

### Batch Optimize
```
POST /mcp/optimize/batch
Authorization: Bearer <api-key>

{
  "items": [
    { "content": "<svg>...</svg>", "filename": "icon1.svg" },
    { "content": "<svg>...</svg>", "filename": "icon2.svg" }
  ],
  "camelCase": true
}
```

### Usage Statistics
```
GET /stats
Authorization: Bearer <api-key>
```

### Per-Key Statistics
```
GET /stats/:keyId
Authorization: Bearer <api-key>
```

## Response Format

### Single Optimization
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

### Batch Optimization
```json
{
  "success": true,
  "total": 5,
  "successful": 5,
  "failed": 0,
  "results": [...]
}
```

## Authentication

Include your API key in the request header:

```
Authorization: Bearer <your-api-key>
```

Or:

```
X-API-Key: <your-api-key>
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | (required for server mode) |
| `API_KEYS` | Comma-separated initial API keys | - |
| `PORT` | HTTP server port | 3000 |
| `CORS_ORIGINS` | Allowed CORS origins | * |

## CamelCase Conversion

When `camelCase` is `true` (default), kebab-case attributes are converted:

| Original | Converted |
|----------|-----------|
| `stroke-width` | `strokeWidth` |
| `fill-opacity` | `fillOpacity` |
| `font-size` | `fontSize` |
| `stroke-linecap` | `strokeLinecap` |
| `clip-path` | `clipPath` |

## Development

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev

# Start HTTP server
pnpm dev

# Start stdio mode (for MCP clients)
pnpm dev:stdio

# Build
pnpm build
```

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Build and run HTTP server |
| `pnpm dev:stdio` | Build and run stdio mode |
| `pnpm build` | Compile TypeScript |
| `pnpm start:server` | Run HTTP server |
| `pnpm start:stdio` | Run stdio mode |
| `pnpm prisma:studio` | Open Prisma Studio |

## License

MIT
