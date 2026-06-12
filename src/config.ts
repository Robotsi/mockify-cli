import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { MockifyConfig } from "./types";

const CONFIG_FILES = [".mockifyrc.json", ".mockifyrc"];

export const DEFAULT_CONFIG: MockifyConfig = {
  port: 4000,
  host: "localhost",
  dir: ".mockify",
  cors: true,
  logLevel: "info",
};

function readConfigFile(cwd: string): Partial<MockifyConfig> {
  for (const fileName of CONFIG_FILES) {
    const filePath = join(cwd, fileName);
    if (!existsSync(filePath)) {
      continue;
    }

    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as Partial<MockifyConfig>;
  }

  return {};
}

export interface ResolvedServerOptions {
  port: number;
  host: string;
  dir: string;
  cors: MockifyConfig["cors"];
  proxy?: MockifyConfig["proxy"];
  logLevel: MockifyConfig["logLevel"];
}

export function resolveServerOptions(
  cwd = process.cwd(),
  cliOptions: Partial<ResolvedServerOptions> = {}
): ResolvedServerOptions {
  const fileConfig = readConfigFile(cwd);

  const port = cliOptions.port ?? fileConfig.port ?? DEFAULT_CONFIG.port;
  const host = cliOptions.host ?? fileConfig.host ?? DEFAULT_CONFIG.host;
  const dir = resolve(cwd, cliOptions.dir ?? fileConfig.dir ?? DEFAULT_CONFIG.dir);
  const cors = cliOptions.cors ?? fileConfig.cors ?? DEFAULT_CONFIG.cors;
  const proxy = cliOptions.proxy ?? fileConfig.proxy;
  const logLevel = cliOptions.logLevel ?? fileConfig.logLevel ?? DEFAULT_CONFIG.logLevel;

  return { port, host, dir, cors, proxy, logLevel };
}
