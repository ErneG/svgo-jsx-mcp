import chalk from "chalk";

export interface OptimizationResult {
  filename: string;
  originalSize: number;
  optimizedSize: number;
  savedBytes: number;
  savedPercent: string;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const size = bytes / Math.pow(k, i);

  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Print optimization result for a single file
 */
export function printResult(result: OptimizationResult): void {
  const savedColor = result.savedBytes > 0 ? chalk.green : chalk.yellow;

  console.error(
    `${chalk.blue(result.filename)}: ${formatBytes(result.originalSize)} → ${formatBytes(result.optimizedSize)} (${savedColor(result.savedPercent)} saved)`
  );
}

/**
 * Print batch summary
 */
export function printBatchSummary(results: OptimizationResult[]): void {
  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalOptimized = results.reduce((sum, r) => sum + r.optimizedSize, 0);
  const totalSaved = totalOriginal - totalOptimized;
  const savedPercent = totalOriginal > 0 ? ((totalSaved / totalOriginal) * 100).toFixed(1) : "0.0";

  console.error("");
  console.error(chalk.bold("Summary:"));
  console.error(`  Files processed: ${chalk.cyan(results.length)}`);
  console.error(`  Total original:  ${formatBytes(totalOriginal)}`);
  console.error(`  Total optimized: ${formatBytes(totalOptimized)}`);
  console.error(
    `  Total saved:     ${chalk.green(`${formatBytes(totalSaved)} (${savedPercent}%)`)}`
  );
}

/**
 * Print error message
 */
export function printError(message: string): void {
  console.error(chalk.red(`Error: ${message}`));
}

/**
 * Print warning message
 */
export function printWarning(message: string): void {
  console.error(chalk.yellow(`Warning: ${message}`));
}

/**
 * Print success message
 */
export function printSuccess(message: string): void {
  console.error(chalk.green(message));
}

/**
 * Print info message
 */
export function printInfo(message: string): void {
  console.error(chalk.blue(message));
}
