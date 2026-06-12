import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { resolveServerOptions } from "./config";

describe("resolveServerOptions", () => {
  let cwd: string;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), "mockify-config-"));
  });

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  test("uses defaults when no config exists", () => {
    const options = resolveServerOptions(cwd);

    expect(options.port).toBe(4000);
    expect(options.host).toBe("localhost");
    expect(options.dir.endsWith(".mockify")).toBe(true);
    expect(options.cors).toBe(true);
  });

  test("reads .mockifyrc.json values", () => {
    writeFileSync(
      join(cwd, ".mockifyrc.json"),
      JSON.stringify({ port: 5050, host: "0.0.0.0", dir: "mocks" })
    );

    const options = resolveServerOptions(cwd);

    expect(options.port).toBe(5050);
    expect(options.host).toBe("0.0.0.0");
    expect(options.dir.endsWith("mocks")).toBe(true);
  });

  test("lets CLI options override config file", () => {
    writeFileSync(join(cwd, ".mockifyrc.json"), JSON.stringify({ port: 5050 }));

    const options = resolveServerOptions(cwd, { port: 3000 });

    expect(options.port).toBe(3000);
  });
});
