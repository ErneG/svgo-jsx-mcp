import path from "node:path";
import { optimizeSvg } from "@svgo-jsx/shared";
import { readFromFile, readFromStdin, writeToFile, hasStdinData } from "../utils/file-handler.js";
import { printResult, printError, printInfo } from "../utils/progress.js";
import { generateReactComponent, filenameToComponentName } from "../templates/react-component.js";

export interface OptimizeOptions {
  output?: string;
  camelcase?: boolean;
  react?: boolean;
  dryRun?: boolean;
  quiet?: boolean;
}

/**
 * Optimize a single SVG file or stdin input
 */
export async function optimizeCommand(
  inputFile: string | undefined,
  options: OptimizeOptions
): Promise<void> {
  const { output, camelcase = true, react = false, dryRun = false, quiet = false } = options;

  try {
    let content: string;
    let filename: string;

    // Read from stdin or file
    if (!inputFile && hasStdinData()) {
      content = await readFromStdin();
      filename = "stdin.svg";

      if (!content.trim()) {
        printError("No input provided. Use a file path or pipe SVG content.");
        process.exit(1);
      }
    } else if (inputFile) {
      content = await readFromFile(inputFile);
      filename = path.basename(inputFile);
    } else {
      printError("No input provided. Use a file path or pipe SVG content.");
      process.exit(1);
    }

    // Optimize the SVG
    const result = optimizeSvg({
      content,
      filename,
      camelCase: camelcase,
    });

    // Generate output content
    let outputContent: string;

    if (react) {
      outputContent = generateReactComponent(result.result, filename, {
        componentName: filenameToComponentName(filename),
        typescript: true,
        memo: true,
        propsInterface: true,
      });
    } else {
      outputContent = result.result;
    }

    // Handle output
    if (dryRun) {
      if (!quiet) {
        printInfo(`[DRY RUN] Would optimize: ${filename}`);
        printResult({
          filename,
          originalSize: result.optimization.originalSize,
          optimizedSize: result.optimization.optimizedSize,
          savedBytes: result.optimization.savedBytes,
          savedPercent: result.optimization.savedPercent,
        });
      }
    } else if (output) {
      // Write to file
      await writeToFile(output, outputContent);

      if (!quiet) {
        printResult({
          filename,
          originalSize: result.optimization.originalSize,
          optimizedSize: result.optimization.optimizedSize,
          savedBytes: result.optimization.savedBytes,
          savedPercent: result.optimization.savedPercent,
        });
        printInfo(`Written to: ${output}`);
      }
    } else {
      // Output to stdout
      process.stdout.write(outputContent);

      if (!quiet) {
        // Print stats to stderr so they don't interfere with piping
        printResult({
          filename,
          originalSize: result.optimization.originalSize,
          optimizedSize: result.optimization.optimizedSize,
          savedBytes: result.optimization.savedBytes,
          savedPercent: result.optimization.savedPercent,
        });
      }
    }
  } catch (error) {
    printError(error instanceof Error ? error.message : "Unknown error");
    process.exit(1);
  }
}
