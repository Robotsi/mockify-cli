import { existsSync } from "node:fs";
import { join } from "node:path";
import pc from "picocolors";
import { applyCorsHeaders, createPreflightResponse, resolveCorsConfig } from "./cors";
import type { ResolvedServerOptions } from "./config";
import { proxyRequest } from "./proxy";
import { matchDynamicRoute } from "./router";
import { importScript, readTextFile, startHttpServer } from "./runtime";
import type { JsonMockMetadata, MockResponse } from "./types";

function parseJsonMock(content: string): {
  status: number;
  delay: number;
  body: unknown;
} {
  const parsed = JSON.parse(content) as Record<string, unknown>;
  const metadata = parsed._mockify as JsonMockMetadata | undefined;

  if (!metadata) {
    return { status: 200, delay: 0, body: parsed };
  }

  const { _mockify, ...rest } = parsed;
  return {
    status: metadata.status ?? 200,
    delay: metadata.delay ?? 0,
    body: rest,
  };
}

function withCors(response: Response, cors: ReturnType<typeof resolveCorsConfig>): Response {
  const headers = new Headers(response.headers);
  applyCorsHeaders(headers, cors);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function createRequestHandler(options: ResolvedServerOptions) {
  const { dir: mockifyDir, cors: corsConfig, proxy, logLevel } = options;
  const cors = resolveCorsConfig(corsConfig);

  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    const method = req.method;
    const pathname = url.pathname;

    if (method === "OPTIONS" && cors.enabled) {
      return createPreflightResponse(cors);
    }

    const statusParam = url.searchParams.get("_status");
    const delayParam = url.searchParams.get("_delay");

    if (logLevel === "info") {
      console.log(
        `${pc.blue(`[${method}]`)} ${pathname} ${
          delayParam ? pc.yellow(`(Delay: ${delayParam}ms)`) : ""
        } ${statusParam ? pc.magenta(`(Status: ${statusParam})`) : ""}`
      );
    }

    const applyDelay = async (delayMs: number) => {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    };

    if (delayParam) {
      const delayMs = parseInt(delayParam, 10);
      if (!isNaN(delayMs) && delayMs > 0) {
        await applyDelay(delayMs);
      }
    }

    if (statusParam) {
      const customStatus = parseInt(statusParam, 10);
      if (!isNaN(customStatus) && customStatus >= 200 && customStatus < 600) {
        return withCors(
          new Response(
            JSON.stringify({
              mockify_controlled_error: true,
              message: `Mockify simulated HTTP ${customStatus} status code.`,
              status: customStatus,
            }),
            {
              status: customStatus,
              headers: { "Content-Type": "application/json" },
            }
          ),
          cors
        );
      }
    }

    const targetDir = pathname === "/" ? "index" : pathname.slice(1);

    const extensions = ["ts", "js", "json"];
    let matchedFilePath: string | null = null;
    let routeParams: Record<string, string> = {};

    for (const ext of extensions) {
      const testPath = join(mockifyDir, targetDir, `${method}.${ext}`);
      if (existsSync(testPath)) {
        matchedFilePath = testPath;
        break;
      }
    }

    if (!matchedFilePath) {
      const dynamicMatch = matchDynamicRoute(mockifyDir, pathname);
      if (dynamicMatch) {
        routeParams = dynamicMatch.params;
        for (const ext of extensions) {
          const testPath = join(dynamicMatch.filePath, `${method}.${ext}`);
          if (existsSync(testPath)) {
            matchedFilePath = testPath;
            break;
          }
        }
      }
    }

    if (matchedFilePath) {
      const responseHeaders = new Headers({
        "X-Powered-By": "Mockify CLI",
      });

      if (Object.keys(routeParams).length > 0) {
        responseHeaders.set("X-Mockify-Params", JSON.stringify(routeParams));
      }

      const isScript = matchedFilePath.endsWith(".ts") || matchedFilePath.endsWith(".js");

      if (isScript) {
        try {
          const scriptModule = await importScript(matchedFilePath);

          if (typeof scriptModule.default === "function") {
            const result = (await scriptModule.default(req, routeParams)) as MockResponse;

            if (result.headers) {
              Object.entries(result.headers).forEach(([key, value]) => {
                responseHeaders.set(key, String(value));
              });
            }

            if (!responseHeaders.has("Content-Type")) {
              responseHeaders.set("Content-Type", "application/json");
            }

            applyCorsHeaders(responseHeaders, cors);

            return new Response(
              typeof result.body === "object" ? JSON.stringify(result.body) : String(result.body ?? ""),
              {
                status: result.status || 200,
                headers: responseHeaders,
              }
            );
          }
        } catch (scriptError) {
          const message = scriptError instanceof Error ? scriptError.message : "Unknown error";
          console.error(pc.red(`[Script Execution Error]: ${message}`));
          return withCors(
            new Response(
              JSON.stringify({ error: "Runtime error in mock script", details: message }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            ),
            cors
          );
        }
      }

      const fileContent = await readTextFile(matchedFilePath);
      const { status, delay, body } = parseJsonMock(fileContent);

      if (!delayParam && delay > 0) {
        await applyDelay(delay);
      }

      responseHeaders.set("Content-Type", "application/json");
      applyCorsHeaders(responseHeaders, cors);

      return new Response(JSON.stringify(body), { status, headers: responseHeaders });
    }

    if (proxy?.target) {
      const proxied = await proxyRequest(req, proxy);
      return withCors(proxied, cors);
    }

    return withCors(
      new Response(
        JSON.stringify({ error: `Mock target not found for [${method}] ${pathname}` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      ),
      cors
    );
  };
}

export function startServer(options: ResolvedServerOptions) {
  const handler = createRequestHandler(options);
  const server = startHttpServer(options.host, options.port, handler);

  console.log(pc.cyan(`\n✨ Server running on: http://${options.host}:${options.port}`));
  console.log(pc.dim(`Serving mocks from: ${options.dir}\n`));

  return server;
}
