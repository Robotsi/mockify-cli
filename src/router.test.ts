import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { matchDynamicRoute } from "./router";

describe("matchDynamicRoute", () => {
  let mockifyDir: string;

  beforeEach(() => {
    mockifyDir = mkdtempSync(join(tmpdir(), "mockify-router-"));
  });

  afterEach(() => {
    rmSync(mockifyDir, { recursive: true, force: true });
  });

  test("statik rota eşleşmesi", () => {
    mkdirSync(join(mockifyDir, "users"), { recursive: true });
    writeFileSync(join(mockifyDir, "users", "GET.json"), "{}");

    const result = matchDynamicRoute(mockifyDir, "/users");

    expect(result).not.toBeNull();
    expect(result!.filePath).toBe(join(mockifyDir, "users"));
    expect(result!.params).toEqual({});
  });

  test("dinamik [id] parametresi yakalar", () => {
    mkdirSync(join(mockifyDir, "users", "[id]"), { recursive: true });
    writeFileSync(join(mockifyDir, "users", "[id]", "GET.json"), "{}");

    const result = matchDynamicRoute(mockifyDir, "/users/42");

    expect(result).not.toBeNull();
    expect(result!.filePath).toBe(join(mockifyDir, "users", "[id]"));
    expect(result!.params).toEqual({ id: "42" });
  });

  test("iç içe dinamik rotalar", () => {
    mkdirSync(join(mockifyDir, "users", "[userId]", "posts", "[postId]"), {
      recursive: true,
    });
    writeFileSync(
      join(mockifyDir, "users", "[userId]", "posts", "[postId]", "GET.json"),
      "{}"
    );

    const result = matchDynamicRoute(mockifyDir, "/users/alperen/posts/7");

    expect(result).not.toBeNull();
    expect(result!.params).toEqual({ userId: "alperen", postId: "7" });
  });

  test("statik segment dinamik segmentten önce tercih edilir", () => {
    mkdirSync(join(mockifyDir, "users", "me"), { recursive: true });
    mkdirSync(join(mockifyDir, "users", "[id]"), { recursive: true });
    writeFileSync(join(mockifyDir, "users", "me", "GET.json"), "{}");
    writeFileSync(join(mockifyDir, "users", "[id]", "GET.json"), "{}");

    const result = matchDynamicRoute(mockifyDir, "/users/me");

    expect(result).not.toBeNull();
    expect(result!.filePath).toBe(join(mockifyDir, "users", "me"));
    expect(result!.params).toEqual({});
  });

  test("eşleşme yoksa null döner", () => {
    mkdirSync(join(mockifyDir, "users"), { recursive: true });

    expect(matchDynamicRoute(mockifyDir, "/users/99")).toBeNull();
    expect(matchDynamicRoute(mockifyDir, "/unknown")).toBeNull();
  });

  test("boş path mockify kök dizinini döner", () => {
    mkdirSync(join(mockifyDir, "index"), { recursive: true });
    writeFileSync(join(mockifyDir, "index", "GET.json"), "{}");

    const result = matchDynamicRoute(mockifyDir, "/");

    expect(result).not.toBeNull();
    expect(result!.filePath).toBe(mockifyDir);
    expect(result!.params).toEqual({});
  });
});
