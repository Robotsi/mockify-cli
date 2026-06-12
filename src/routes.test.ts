import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { discoverRoutes } from "./routes";
import { exportOpenApi } from "./openapi";

describe("discoverRoutes", () => {
  let mockifyDir: string;

  beforeEach(() => {
    mockifyDir = mkdtempSync(join(tmpdir(), "mockify-routes-"));
  });

  afterEach(() => {
    rmSync(mockifyDir, { recursive: true, force: true });
  });

  test("discovers static and dynamic routes", () => {
    mkdirSync(join(mockifyDir, "users", "[id]"), { recursive: true });
    writeFileSync(join(mockifyDir, "users", "GET.json"), "{}");
    writeFileSync(join(mockifyDir, "users", "[id]", "GET.json"), "{}");

    const routes = discoverRoutes(mockifyDir);

    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ method: "GET", path: "/users" }),
        expect.objectContaining({ method: "GET", path: "/users/{id}" }),
      ])
    );
  });
});

describe("exportOpenApi", () => {
  let mockifyDir: string;

  beforeEach(() => {
    mockifyDir = mkdtempSync(join(tmpdir(), "mockify-openapi-"));
    mkdirSync(join(mockifyDir, "users"), { recursive: true });
    writeFileSync(join(mockifyDir, "users", "GET.json"), "{}");
  });

  afterEach(() => {
    rmSync(mockifyDir, { recursive: true, force: true });
  });

  test("generates OpenAPI document", () => {
    const doc = exportOpenApi(mockifyDir);

    expect(doc.openapi).toBe("3.0.3");
    expect(doc.paths["/users"]?.get).toBeDefined();
  });
});
