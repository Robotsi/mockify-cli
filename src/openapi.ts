import { discoverRoutes } from "./routes";

export function exportOpenApi(mockifyDir: string) {
  const routes = discoverRoutes(mockifyDir);

  const paths: Record<string, Record<string, unknown>> = {};

  for (const route of routes) {
    const method = route.method.toLowerCase();
    paths[route.path] ??= {};
    paths[route.path][method] = {
      summary: `Mock route from ${route.file}`,
      responses: {
        "200": {
          description: "Successful mock response",
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
      },
    };
  }

  return {
    openapi: "3.0.3",
    info: {
      title: "Mockify API",
      version: "1.0.0",
      description: "Auto-generated OpenAPI document from .mockify route files.",
    },
    paths,
  };
}
