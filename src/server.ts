import { existsSync } from "node:fs";
import { join } from "node:path";
import pc from "picocolors";
import { matchDynamicRoute } from "./router";

export function createRequestHandler(mockifyDir = join(process.cwd(), ".mockify")) {
  return async (req: Request): Promise<Response> => {
      const url = new URL(req.url);
      const method = req.method; // GET, POST vb.
      const pathname = url.pathname;

      const statusParam = url.searchParams.get("_status");
      const delayParam = url.searchParams.get("_delay");

      console.log(
        `${pc.blue(`[${method}]`)} ${pathname} ${
          delayParam ? pc.yellow(`(Delay: ${delayParam}ms)`) : ""
        } ${statusParam ? pc.magenta(`(Status: ${statusParam})`) : ""}`
      );

      // Built-in latency simulation
      if (delayParam) {
        const delayMs = parseInt(delayParam, 10);
        if (!isNaN(delayMs) && delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      // Quick status code overriding for error testing
      if (statusParam) {
        const customStatus = parseInt(statusParam, 10);
        if (!isNaN(customStatus) && customStatus >= 200 && customStatus < 600) {
          return new Response(
            JSON.stringify({
              mockify_controlled_error: true,
              message: `Mockify simulated HTTP ${customStatus} status code.`,
              status: customStatus,
            }),
            {
              status: customStatus,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }

      const targetDir = pathname === "/" ? "index" : pathname;
      
      const extensions = ["ts", "js", "json"];
      let matchedFilePath: string | null = null;
      let routeParams: Record<string, string> = {};

      // Try static routes first
      for (const ext of extensions) {
        const testPath = join(mockifyDir, targetDir, `${method}.${ext}`);
        if (existsSync(testPath)) {
          matchedFilePath = testPath;
          break;
        }
      }

      // Fallback to dynamic recursive routing
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
        const isScript = matchedFilePath.endsWith(".ts") || matchedFilePath.endsWith(".js");

        const responseHeaders = new Headers({
          "X-Powered-By": "Mockify CLI",
        });
        if (Object.keys(routeParams).length > 0) {
          responseHeaders.set("X-Mockify-Params", JSON.stringify(routeParams));
        }

        // Executing programmable script routes (.ts / .js)
        if (isScript) {
          try {
            const scriptModule = await import(`${matchedFilePath}?update=${Date.now()}`);
            // Append timestamp query to bypass Node/Bun ESM import caching mechanism            
            if (typeof scriptModule.default === "function") {
              const result = await scriptModule.default(req, routeParams);
              
              if (result.headers) {
                Object.entries(result.headers).forEach(([key, value]) => {
                  responseHeaders.set(key, String(value));
                });
              }

              if (!responseHeaders.has("Content-Type")) {
                responseHeaders.set("Content-Type", "application/json");
              }

              return new Response(
                typeof result.body === "object" ? JSON.stringify(result.body) : result.body,
                {
                  status: result.status || 200,
                  headers: responseHeaders
                }
              );
            }
          } catch (scriptError: any) {
            console.error(pc.red(`[Script Execution Error]: ${scriptError.message}`));
            return new Response(
              JSON.stringify({ error: "Runtime error in mock script", details: scriptError.message }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        }

        // Serving static JSON files
        const fileContent = await Bun.file(matchedFilePath).text();
        responseHeaders.set("Content-Type", "application/json");
        return new Response(fileContent, { status: 200, headers: responseHeaders });
      }

      return new Response(
        JSON.stringify({ error: `Mock target not found for [${method}] ${pathname}` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
  };
}

export function startServer(port: number) {
  const server = Bun.serve({
    port,
    fetch: createRequestHandler(),
  });

  console.log(pc.cyan(`\n✨ Server running on: http://localhost:${port}`));
  console.log(pc.dim("Watching .mockify/ directory for file changes or scripts...\n"));

  return server;
}