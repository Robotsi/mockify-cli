import type { CorsConfig, MockifyConfig } from "./types";

export function resolveCorsConfig(cors: MockifyConfig["cors"]): CorsConfig {
  if (cors === false) {
    return { enabled: false, origin: "*" };
  }

  if (typeof cors === "object" && cors.origin) {
    return { enabled: true, origin: cors.origin };
  }

  return { enabled: true, origin: "*" };
}

export function applyCorsHeaders(headers: Headers, cors: CorsConfig): void {
  if (!cors.enabled) {
    return;
  }

  headers.set("Access-Control-Allow-Origin", cors.origin);
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export function createPreflightResponse(cors: CorsConfig): Response {
  const headers = new Headers();
  applyCorsHeaders(headers, cors);
  return new Response(null, { status: 204, headers });
}
