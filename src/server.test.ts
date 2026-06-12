import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createRequestHandler } from "./server";
import type { ResolvedServerOptions } from "./config";

function createHandler(mockifyDir: string, overrides: Partial<ResolvedServerOptions> = {}) {
  return createRequestHandler({
    port: 4000,
    host: "localhost",
    dir: mockifyDir,
    cors: true,
    logLevel: "silent",
    ...overrides,
  });
}

describe("createRequestHandler", () => {
  let mockifyDir: string;

  beforeEach(() => {
    mockifyDir = mkdtempSync(join(tmpdir(), "mockify-server-"));
  });

  afterEach(() => {
    rmSync(mockifyDir, { recursive: true, force: true });
  });

  test("serves static JSON files", async () => {
    mkdirSync(join(mockifyDir, "users"), { recursive: true });
    writeFileSync(
      join(mockifyDir, "users", "GET.json"),
      JSON.stringify({ status: "ok" })
    );

    const response = await createHandler(mockifyDir)(new Request("http://localhost/users"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Powered-By")).toBe("Mockify CLI");
    expect(body).toEqual({ status: "ok" });
  });

  test("maps root path to index directory", async () => {
    mkdirSync(join(mockifyDir, "index"), { recursive: true });
    writeFileSync(
      join(mockifyDir, "index", "GET.json"),
      JSON.stringify({ hello: "world" })
    );

    const response = await createHandler(mockifyDir)(new Request("http://localhost/"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ hello: "world" });
  });

  test("adds dynamic route params to response headers", async () => {
    mkdirSync(join(mockifyDir, "users", "[id]"), { recursive: true });
    writeFileSync(join(mockifyDir, "users", "[id]", "GET.json"), "{}");

    const response = await createHandler(mockifyDir)(new Request("http://localhost/users/99"));

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Mockify-Params")).toBe(JSON.stringify({ id: "99" }));
  });

  test("simulates errors with _status query param", async () => {
    const response = await createHandler(mockifyDir)(
      new Request("http://localhost/users?_status=503")
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.mockify_controlled_error).toBe(true);
    expect(body.status).toBe(503);
  });

  test("ignores invalid _status values", async () => {
    mkdirSync(join(mockifyDir, "users"), { recursive: true });
    writeFileSync(join(mockifyDir, "users", "GET.json"), "{}");

    const response = await createHandler(mockifyDir)(
      new Request("http://localhost/users?_status=999")
    );

    expect(response.status).toBe(200);
  });

  test("delays responses with _delay query param", async () => {
    mkdirSync(join(mockifyDir, "ping"), { recursive: true });
    writeFileSync(join(mockifyDir, "ping", "GET.json"), "{}");

    const start = Date.now();
    const response = await createHandler(mockifyDir)(
      new Request("http://localhost/ping?_delay=50")
    );
    const elapsed = Date.now() - start;

    expect(response.status).toBe(200);
    expect(elapsed).toBeGreaterThanOrEqual(40);
  });

  test("executes programmable .ts routes", async () => {
    mkdirSync(join(mockifyDir, "items"), { recursive: true });
    writeFileSync(
      join(mockifyDir, "items", "POST.ts"),
      `export default async function handle(req) {
        const body = await req.json();
        return { status: 201, body: { received: body.name } };
      }`
    );

    const response = await createHandler(mockifyDir)(
      new Request("http://localhost/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "test" }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({ received: "test" });
  });

  test("returns 500 when script throws", async () => {
    mkdirSync(join(mockifyDir, "broken"), { recursive: true });
    writeFileSync(
      join(mockifyDir, "broken", "GET.ts"),
      `export default async function handle() {
        throw new Error("boom");
      }`
    );

    const response = await createHandler(mockifyDir)(new Request("http://localhost/broken"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Runtime error in mock script");
  });

  test("returns 404 for unmatched routes", async () => {
    const response = await createHandler(mockifyDir)(new Request("http://localhost/missing"));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toContain("Mock target not found");
  });

  test("adds CORS headers by default", async () => {
    mkdirSync(join(mockifyDir, "users"), { recursive: true });
    writeFileSync(join(mockifyDir, "users", "GET.json"), "{}");

    const response = await createHandler(mockifyDir)(new Request("http://localhost/users"));

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  test("handles OPTIONS preflight requests", async () => {
    const response = await createHandler(mockifyDir)(
      new Request("http://localhost/users", { method: "OPTIONS" })
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("GET");
  });

  test("applies _mockify metadata from JSON files", async () => {
    mkdirSync(join(mockifyDir, "posts"), { recursive: true });
    writeFileSync(
      join(mockifyDir, "posts", "GET.json"),
      JSON.stringify({
        _mockify: { status: 201, delay: 0 },
        data: [{ id: 1 }],
      })
    );

    const response = await createHandler(mockifyDir)(new Request("http://localhost/posts"));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({ data: [{ id: 1 }] });
  });

  test("proxies unmatched routes when proxy is configured", async () => {
    const response = await createHandler(mockifyDir, {
      proxy: { target: "https://httpbin.org" },
    })(new Request("http://localhost/get"));

    expect(response.status).toBe(200);
  });
});
