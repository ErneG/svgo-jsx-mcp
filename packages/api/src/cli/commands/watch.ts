import path from "node:path";
import { watch } from "chokidar";
import { optimizeSvg } from "@svgo-jsx/shared";
import { readFromFile, writeToFile } from "../utils/file-handler.js";
import { printResult, printError, printInfo, printSuccess } from "../utils/progress.js";
import { generateReactComponent, filenameToComponentName } from "../templates/react-component.js";

export interface WatchOptions {
  outputDir?: string;
  pattern?: string;
  camelcase?: boolean;
  react?: boolean;
}

/**
 * Watch a directory for SVG file changes and optimize on save
 */
export async function watchCommand(directory: string, options: WatchOptions): Promise<void> {
  const { outputDir, pattern = "**/*.svg", camelcase = true, react = false } = options;

  const absoluteDir = path.resolve(directory);

  printInfo(`Watching for SVG changes in: ${absoluteDir}`);
  printInfo(`Pattern: ${pattern}`);
  if (outputDir) {
    printInfo(`Output directory: ${path.resolve(outputDir)}`);
  }
  console.error("");

  const watcher = watch(path.join(absoluteDir, pattern), {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100,
    },
  });

  async function processFile(filePath: string) {
    const filename = path.basename(filePath);
    const relativePath = path.relative(absoluteDir, filePath);

    try {
      const content = await readFromFile(filePath);

      const result = optimizeSvg({
        content,
        filename,
        camelCase: camelcase,
      });

      // Generate output content
      let outputContent: string;
      let outputFilename: string;

      if (react) {
        outputContent = generateReactComponent(result.result, filename, {
          componentName: filenameToComponentName(filename),
          typescript: true,
          memo: true,
          propsInterface: true,
        });
        outputFilename = `${path.parse(filename).name}.tsx`;
      } else {
        outputContent = result.result;
        outputFilename = filename;
      }

      // Determine output path
      const outputPath = outputDir
        ? path.join(outputDir, outputFilename)
        : path.join(path.dirname(filePath), outputFilename);

      await writeToFile(outputPath, outputContent);

      printResult({
        filename: relativePath,
        originalSize: result.optimization.originalSize,
        optimizedSize: result.optimization.optimizedSize,
        savedBytes: result.optimization.savedBytes,
        savedPercent: result.optimization.savedPercent,
      });
    } catch (error) {
      printError(`${relativePath}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  watcher.on("add", (filePath) => {
    printInfo(`New file: ${path.relative(absoluteDir, filePath)}`);
    processFile(filePath);
  });

  watcher.on("change", (filePath) => {
    processFile(filePath);
  });

  watcher.on("error", (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    printError(`Watcher error: ${message}`);
  });

  watcher.on("ready", () => {
    printSuccess("Watching for changes... (Ctrl+C to stop)");
    console.error("");
  });

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.error("");
    printInfo("Stopping watcher...");
    watcher.close().then(() => {
      process.exit(0);
    });
  });

  // Keep the process running
  await new Promise(() => {});
}
