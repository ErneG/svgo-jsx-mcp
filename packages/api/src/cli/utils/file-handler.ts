import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Read SVG content from stdin (for piping)
 */
export async function readFromStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";

    // Check if stdin is a TTY (interactive terminal)
    if (process.stdin.isTTY) {
      resolve("");
      return;
    }

    process.stdin.setEncoding("utf8");

    process.stdin.on("data", (chunk) => {
      data += chunk;
    });

    process.stdin.on("end", () => {
      resolve(data);
    });

    process.stdin.on("error", (err) => {
      reject(err);
    });

    // Set a timeout to prevent hanging if no data is piped
    setTimeout(() => {
      if (data === "") {
        resolve("");
      }
    }, 100);
  });
}

/**
 * Read SVG content from a file
 */
export async function readFromFile(filePath: string): Promise<string> {
  const absolutePath = path.resolve(filePath);

  try {
    await fs.access(absolutePath);
  } catch {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = await fs.readFile(absolutePath, "utf8");
  return content;
}

/**
 * Write content to a file
 */
export async function writeToFile(filePath: string, content: string): Promise<void> {
  const absolutePath = path.resolve(filePath);
  const dir = path.dirname(absolutePath);

  // Ensure directory exists
  await fs.mkdir(dir, { recursive: true });

  await fs.writeFile(absolutePath, content, "utf8");
}

/**
 * Get all SVG files in a directory
 */
export async function getSvgFiles(
  directory: string,
  options: { recursive?: boolean; pattern?: string } = {}
): Promise<string[]> {
  const { recursive = false, pattern = "*.svg" } = options;
  const absoluteDir = path.resolve(directory);

  try {
    await fs.access(absoluteDir);
  } catch {
    throw new Error(`Directory not found: ${directory}`);
  }

  const files: string[] = [];

  async function scanDir(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && recursive) {
        await scanDir(fullPath);
      } else if (entry.isFile() && matchesPattern(entry.name, pattern)) {
        files.push(fullPath);
      }
    }
  }

  await scanDir(absoluteDir);
  return files.sort();
}

/**
 * Check if filename matches a glob-like pattern
 */
function matchesPattern(filename: string, pattern: string): boolean {
  // Simple pattern matching: support *.svg and similar
  const regexPattern = pattern.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\?/g, ".");

  return new RegExp(`^${regexPattern}$`, "i").test(filename);
}

/**
 * Generate output path for a file
 */
export function getOutputPath(inputPath: string, outputDir?: string, suffix?: string): string {
  const parsed = path.parse(inputPath);
  const newName = suffix ? `${parsed.name}${suffix}${parsed.ext}` : `${parsed.name}${parsed.ext}`;

  if (outputDir) {
    return path.join(outputDir, newName);
  }

  return path.join(parsed.dir, newName);
}

/**
 * Check if stdin has data available
 */
export function hasStdinData(): boolean {
  return !process.stdin.isTTY;
}
