import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

/**
 * This test verifies that all API endpoints referenced by hooks actually exist.
 * This would have caught the missing /api/admin/stats/time-series endpoint.
 */

// API endpoints that hooks depend on
const HOOK_API_DEPENDENCIES = {
  "use-api-keys.ts": [
    { method: "GET", path: "/api/admin/keys" },
    { method: "POST", path: "/api/admin/keys" },
    { method: "PATCH", path: "/api/admin/keys/[id]" },
    { method: "DELETE", path: "/api/admin/keys/[id]" },
  ],
  "use-stats.ts": [
    { method: "GET", path: "/api/admin/stats" },
    { method: "GET", path: "/api/admin/stats/time-series" },
  ],
};

// Convert API path to file system path
function apiPathToFilePath(apiPath: string): string {
  // Remove /api prefix and convert to file path
  const relativePath = apiPath.replace("/api/", "");
  return join(process.cwd(), "src/app/api", relativePath);
}

// Check if an API route exists
function apiRouteExists(apiPath: string): boolean {
  const basePath = apiPathToFilePath(apiPath);

  // Check for route.ts in the directory
  const routeFile = join(basePath, "route.ts");
  if (existsSync(routeFile)) {
    return true;
  }

  // Also check for route.tsx
  const routeTsxFile = join(basePath, "route.tsx");
  if (existsSync(routeTsxFile)) {
    return true;
  }

  return false;
}

// Check if a specific HTTP method is exported from a route file
function routeHasMethod(apiPath: string, method: string): boolean {
  const basePath = apiPathToFilePath(apiPath);
  const routeFile = join(basePath, "route.ts");

  if (!existsSync(routeFile)) {
    return false;
  }

  // Read the file and check for the method export
  const content = readFileSync(routeFile, "utf-8");

  // Check for exported function with the method name
  const exportPatterns = [
    new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`),
    new RegExp(`export\\s+function\\s+${method}\\s*\\(`),
    new RegExp(`export\\s+const\\s+${method}\\s*=`),
  ];

  return exportPatterns.some((pattern) => pattern.test(content));
}

describe("API Route Existence", () => {
  describe("Hook API Dependencies", () => {
    Object.entries(HOOK_API_DEPENDENCIES).forEach(([hookFile, endpoints]) => {
      describe(`${hookFile}`, () => {
        endpoints.forEach(({ method, path }) => {
          it(`should have ${method} ${path} endpoint`, () => {
            const exists = apiRouteExists(path);
            expect(
              exists,
              `API route ${path} referenced by ${hookFile} does not exist. ` +
                `Create the route file at src/app/api${path.replace("/api", "")}/route.ts`
            ).toBe(true);
          });

          it(`should export ${method} handler for ${path}`, () => {
            const hasMethod = routeHasMethod(path, method);
            expect(
              hasMethod,
              `API route ${path} does not export a ${method} handler. ` +
                `Add "export async function ${method}()" to the route file.`
            ).toBe(true);
          });
        });
      });
    });
  });
});

describe("API Directory Structure", () => {
  it("should have admin keys route", () => {
    expect(apiRouteExists("/api/admin/keys")).toBe(true);
  });

  it("should have admin keys [id] route", () => {
    expect(apiRouteExists("/api/admin/keys/[id]")).toBe(true);
  });

  it("should have admin stats route", () => {
    expect(apiRouteExists("/api/admin/stats")).toBe(true);
  });

  it("should have admin stats time-series route", () => {
    expect(apiRouteExists("/api/admin/stats/time-series")).toBe(true);
  });

  it("should have v1 optimize route", () => {
    expect(apiRouteExists("/api/v1/optimize")).toBe(true);
  });

  it("should have v1 batch route", () => {
    expect(apiRouteExists("/api/v1/batch")).toBe(true);
  });
});
