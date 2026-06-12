#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import pc from "picocolors";
import { resolveServerOptions } from "./config";
import { initMockifyDirectory } from "./init";
import { exportOpenApi } from "./openapi";
import { discoverRoutes } from "./routes";
import { startServer } from "./server";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getPackageVersion(): string {
  try {
    const packagePath = join(__dirname, "..", "package.json");
    const pkg = JSON.parse(readFileSync(packagePath, "utf-8")) as { version?: string };
    return pkg.version ?? "1.0.0";
  } catch {
    return "1.0.0";
  }
}

const program = new Command();

program
  .name("mockify")
  .description("Zero-config, file-based local mock API server for frontend developers")
  .version(getPackageVersion());

program
  .command("start")
  .description("Start the mock server")
  .option("-p, --port <number>", "Port to bind the server")
  .option("-H, --host <host>", "Host to bind the server")
  .option("-d, --dir <path>", "Mock directory path")
  .action((options) => {
    const resolved = resolveServerOptions(process.cwd(), {
      port: options.port ? parseInt(options.port, 10) : undefined,
      host: options.host,
      dir: options.dir,
    });

    console.log(pc.green("🚀 Mockify is preparing..."));
    startServer(resolved);
  });

program
  .command("init")
  .description("Scaffold a .mockify directory with example routes")
  .option("-d, --dir <path>", "Mock directory path", ".mockify")
  .action((options) => {
    const dir = initMockifyDirectory(process.cwd(), options.dir);
    console.log(pc.green(`✅ Created mock scaffold at ${dir}`));
  });

program
  .command("routes")
  .description("List discovered mock routes")
  .option("-d, --dir <path>", "Mock directory path")
  .action((options) => {
    const resolved = resolveServerOptions(process.cwd(), { dir: options.dir });
    const routes = discoverRoutes(resolved.dir);

    if (routes.length === 0) {
      console.log(pc.yellow(`No routes found in ${resolved.dir}`));
      return;
    }

    for (const route of routes) {
      console.log(`${pc.blue(route.method.padEnd(7))} ${route.path} ${pc.dim(`→ ${route.file}`)}`);
    }
  });

program
  .command("export-openapi")
  .description("Export an OpenAPI 3 document from .mockify routes")
  .option("-d, --dir <path>", "Mock directory path")
  .option("-o, --output <path>", "Output file path")
  .action((options) => {
    const resolved = resolveServerOptions(process.cwd(), { dir: options.dir });
    const document = exportOpenApi(resolved.dir);
    const output = JSON.stringify(document, null, 2);

    if (options.output) {
      writeFileSync(options.output, output, "utf-8");
      console.log(pc.green(`✅ OpenAPI document written to ${options.output}`));
      return;
    }

    console.log(output);
  });

program.parse(process.argv);
