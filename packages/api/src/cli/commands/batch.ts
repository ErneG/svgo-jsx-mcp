import path from "node:path";
import ora from "ora";
import { handleOptimizeSvg } from "../../optimize.js";
import { readFromFile, writeToFile, getSvgFiles } from "../utils/file-handler.js";
import {
  printBatchSummary,
  printError,
  printWarning,
  printInfo,
  type OptimizationResult,
} from "../utils/progress.js";
import { generateReactComponent, filenameToComponentName } from "../templates/react-component.js";

export interface BatchOptions {
  recursive?: boolean;
  pattern?: string;
  outputDir?: string;
  camelcase?: boolean;
  react?: boolean;
  dryRun?: boolean;
  quiet?: boolean;
}

/**
 * Process multiple SVG files in a directory
 */
export async function batchCommand(directory: string, options: BatchOptions): Promise<void> {
  const {
    recursive = false,
    pattern = "*.svg",
    outputDir,
    camelcase = true,
    react = false,
    dryRun = false,
    quiet = false,
  } = options;

  const spinner = quiet ? null : ora("Scanning for SVG files...").start();

  try {
    // Find all SVG files
    const files = await getSvgFiles(directory, { recursive, pattern });

    if (files.length === 0) {
      spinner?.warn("No SVG files found");
      return;
    }

    spinner?.succeed(`Found ${files.length} SVG file(s)`);

    const results: OptimizationResult[] = [];
    const errors: { file: string; error: string }[] = [];

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filename = path.basename(file);
      const progressSpinner = quiet ? null : ora(`[${i + 1}/${files.length}] ${filename}`).start();

      try {
        const content = await readFromFile(file);

        const resultJson = await handleOptimizeSvg({
          content,
          filename,
          camelCase: camelcase,
        });

        const result = JSON.parse(resultJson);

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

        const resultData: OptimizationResult = {
          filename,
          originalSize: result.optimization.originalSize,
          optimizedSize: result.optimization.optimizedSize,
          savedBytes: result.optimization.savedBytes,
          savedPercent: result.optimization.savedPercent,
        };

        results.push(resultData);

        if (dryRun) {
          progressSpinner?.info(`[DRY RUN] Would optimize: ${filename}`);
        } else {
          // Determine output path
          const outputPath = outputDir
            ? path.join(outputDir, outputFilename)
            : path.join(path.dirname(file), outputFilename);

          await writeToFile(outputPath, outputContent);
          progressSpinner?.succeed(`${filename}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        errors.push({ file: filename, error: errorMessage });
        progressSpinner?.fail(`${filename}: ${errorMessage}`);
      }
    }

    // Print summary
    if (!quiet && results.length > 0) {
      printBatchSummary(results);
    }

    // Print errors summary
    if (errors.length > 0) {
      console.error("");
      printWarning(`${errors.length} file(s) failed to process`);
    }

    if (dryRun && !quiet) {
      console.error("");
      printInfo("No files were modified (dry run mode)");
    }
  } catch (error) {
    spinner?.fail("Failed to process directory");
    printError(error instanceof Error ? error.message : "Unknown error");
    process.exit(1);
  }
}
