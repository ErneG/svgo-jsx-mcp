#!/usr/bin/env node

import { Command } from "commander";
import { optimizeCommand } from "./commands/optimize.js";
import { batchCommand } from "./commands/batch.js";
import { watchCommand } from "./commands/watch.js";

const program = new Command();

program
  .name("svgo-jsx-mcp")
  .description("SVG optimizer with JSX-compatible camelCase conversion")
  .version("0.1.0");

// Default command: optimize single file or stdin
program
  .argument("[file]", "SVG file to optimize (or pipe via stdin)")
  .option("-o, --output <file>", "output file path")
  .option("--no-camelcase", "disable camelCase attribute conversion")
  .option("-r, --react", "output as React component")
  .option("-d, --dry-run", "show what would be done without making changes")
  .option("-q, --quiet", "suppress output except errors")
  .action(async (file, options) => {
    await optimizeCommand(file, options);
  });

// Batch command: process directory
program
  .command("batch <directory>")
  .description("Optimize all SVG files in a directory")
  .option("-R, --recursive", "process subdirectories recursively")
  .option("-p, --pattern <glob>", "file pattern to match", "*.svg")
  .option("-o, --output-dir <dir>", "output directory")
  .option("--no-camelcase", "disable camelCase attribute conversion")
  .option("-r, --react", "output as React components")
  .option("-d, --dry-run", "show what would be done without making changes")
  .option("-q, --quiet", "suppress output except errors")
  .action(async (directory, options) => {
    await batchCommand(directory, options);
  });

// Watch command: watch for changes
program
  .command("watch <directory>")
  .description("Watch a directory for SVG changes and optimize on save")
  .option("-p, --pattern <glob>", "file pattern to match", "**/*.svg")
  .option("-o, --output-dir <dir>", "output directory")
  .option("--no-camelcase", "disable camelCase attribute conversion")
  .option("-r, --react", "output as React components")
  .action(async (directory, options) => {
    await watchCommand(directory, options);
  });

program.parse();
