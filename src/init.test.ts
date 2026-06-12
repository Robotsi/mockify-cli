import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initMockifyDirectory } from "./init";

describe("initMockifyDirectory", () => {
  let cwd: string;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), "mockify-init-"));
  });

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  test("creates scaffold files", () => {
    const dir = initMockifyDirectory(cwd, ".mockify");

    expect(existsSync(join(dir, "index", "GET.json"))).toBe(true);
    expect(existsSync(join(dir, "users", "GET.json"))).toBe(true);
    expect(existsSync(join(dir, "users", "[id]", "GET.json"))).toBe(true);
    expect(existsSync(join(dir, "users", "POST.ts"))).toBe(true);
  });

  test("throws when directory already exists", () => {
    initMockifyDirectory(cwd, ".mockify");
    expect(() => initMockifyDirectory(cwd, ".mockify")).toThrow();
  });
});
