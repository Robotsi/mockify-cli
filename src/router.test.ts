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

  test("matches static routes", () => {
    mkdirSync(join(mockifyDir, "users"), { recursive: true });
    writeFileSync(join(mockifyDir, "users", "GET.json"), "{}");

    const result = matchDynamicRoute(mockifyDir, "/users");

    expect(result).not.toBeNull();
    expect(result!.filePath).toBe(join(mockifyDir, "users"));
    expect(result!.params).toEqual({});
  });

  test("captures dynamic [id] parameter", () => {
    mkdirSync(join(mockifyDir, "users", "[id]"), { recursive: true });
    writeFileSync(join(mockifyDir, "users", "[id]", "GET.json"), "{}");

    const result = matchDynamicRoute(mockifyDir, "/users/42");

    expect(result).not.toBeNull();
    expect(result!.filePath).toBe(join(mockifyDir, "users", "[id]"));
    expect(result!.params).toEqual({ id: "42" });
  });

  test("matches nested dynamic routes", () => {
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

  test("prefers static segments over dynamic ones", () => {
    mkdirSync(join(mockifyDir, "users", "me"), { recursive: true });
    mkdirSync(join(mockifyDir, "users", "[id]"), { recursive: true });
    writeFileSync(join(mockifyDir, "users", "me", "GET.json"), "{}");
    writeFileSync(join(mockifyDir, "users", "[id]", "GET.json"), "{}");

    const result = matchDynamicRoute(mockifyDir, "/users/me");

    expect(result).not.toBeNull();
    expect(result!.filePath).toBe(join(mockifyDir, "users", "me"));
    expect(result!.params).toEqual({});
  });

  test("returns null when no route matches", () => {
    mkdirSync(join(mockifyDir, "users"), { recursive: true });

    expect(matchDynamicRoute(mockifyDir, "/users/99")).toBeNull();
    expect(matchDynamicRoute(mockifyDir, "/unknown")).toBeNull();
  });

  test("returns root directory for empty path", () => {
    mkdirSync(join(mockifyDir, "index"), { recursive: true });
    writeFileSync(join(mockifyDir, "index", "GET.json"), "{}");

    const result = matchDynamicRoute(mockifyDir, "/");

    expect(result).not.toBeNull();
    expect(result!.filePath).toBe(mockifyDir);
    expect(result!.params).toEqual({});
  });

  test("supports catch-all [...slug] routes", () => {
    mkdirSync(join(mockifyDir, "files", "[...slug]"), { recursive: true });
    writeFileSync(join(mockifyDir, "files", "[...slug]", "GET.json"), "{}");

    const result = matchDynamicRoute(mockifyDir, "/files/docs/guide/intro");

    expect(result).not.toBeNull();
    expect(result!.filePath).toBe(join(mockifyDir, "files", "[...slug]"));
    expect(result!.params).toEqual({ slug: "docs/guide/intro" });
  });
});
