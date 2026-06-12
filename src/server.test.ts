import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createRequestHandler } from "./server";

describe("createRequestHandler", () => {
  let mockifyDir: string;
  let handler: (req: Request) => Promise<Response>;

  beforeEach(() => {
    mockifyDir = mkdtempSync(join(tmpdir(), "mockify-server-"));
    handler = createRequestHandler(mockifyDir);
  });

  afterEach(() => {
    rmSync(mockifyDir, { recursive: true, force: true });
  });

  test("statik JSON dosyasını sunar", async () => {
    mkdirSync(join(mockifyDir, "users"), { recursive: true });
    writeFileSync(
      join(mockifyDir, "users", "GET.json"),
      JSON.stringify({ status: "ok" })
    );

    const response = await handler(new Request("http://localhost/users"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Powered-By")).toBe("Mockify CLI");
    expect(body).toEqual({ status: "ok" });
  });

  test("kök path index dizinine yönlendirilir", async () => {
    mkdirSync(join(mockifyDir, "index"), { recursive: true });
    writeFileSync(
      join(mockifyDir, "index", "GET.json"),
      JSON.stringify({ hello: "world" })
    );

    const response = await handler(new Request("http://localhost/"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ hello: "world" });
  });

  test("dinamik rota parametrelerini header'a ekler", async () => {
    mkdirSync(join(mockifyDir, "users", "[id]"), { recursive: true });
    writeFileSync(join(mockifyDir, "users", "[id]", "GET.json"), "{}");

    const response = await handler(new Request("http://localhost/users/99"));

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Mockify-Params")).toBe(JSON.stringify({ id: "99" }));
  });

  test("_status query parametresi ile hata simülasyonu", async () => {
    const response = await handler(new Request("http://localhost/users?_status=503"));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.mockify_controlled_error).toBe(true);
    expect(body.status).toBe(503);
  });

  test("geçersiz _status değeri yok sayılır", async () => {
    mkdirSync(join(mockifyDir, "users"), { recursive: true });
    writeFileSync(join(mockifyDir, "users", "GET.json"), "{}");

    const response = await handler(new Request("http://localhost/users?_status=999"));

    expect(response.status).toBe(200);
  });

  test("_delay query parametresi yanıtı geciktirir", async () => {
    mkdirSync(join(mockifyDir, "ping"), { recursive: true });
    writeFileSync(join(mockifyDir, "ping", "GET.json"), "{}");

    const start = Date.now();
    const response = await handler(new Request("http://localhost/ping?_delay=50"));
    const elapsed = Date.now() - start;

    expect(response.status).toBe(200);
    expect(elapsed).toBeGreaterThanOrEqual(40);
  });

  test("programlanabilir .ts rotasını çalıştırır", async () => {
    mkdirSync(join(mockifyDir, "items"), { recursive: true });
    writeFileSync(
      join(mockifyDir, "items", "POST.ts"),
      `export default async function handle(req) {
        const body = await req.json();
        return { status: 201, body: { received: body.name } };
      }`
    );

    const response = await handler(
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

  test("script hatasında 500 döner", async () => {
    mkdirSync(join(mockifyDir, "broken"), { recursive: true });
    writeFileSync(
      join(mockifyDir, "broken", "GET.ts"),
      `export default async function handle() {
        throw new Error("boom");
      }`
    );

    const response = await handler(new Request("http://localhost/broken"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Runtime error in mock script");
  });

  test("eşleşmeyen rota için 404 döner", async () => {
    const response = await handler(new Request("http://localhost/missing"));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toContain("Mock target not found");
  });
});
