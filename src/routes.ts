import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const HTTP_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]);

export interface DiscoveredRoute {
  method: string;
  path: string;
  file: string;
}

function segmentToOpenApi(segment: string): string {
  if (segment.startsWith("[...") && segment.endsWith("]")) {
    return `{${segment.slice(4, -1)}}`;
  }
  if (segment.startsWith("[") && segment.endsWith("]")) {
    return `{${segment.slice(1, -1)}}`;
  }
  return segment;
}

function dirToPath(relativeDir: string): string {
  if (!relativeDir || relativeDir === ".") {
    return "/";
  }

  const segments = relativeDir.split(/[/\\]/).filter(Boolean);
  const mapped = segments.map((segment) => {
    if (segment === "index") {
      return "";
    }
    return segmentToOpenApi(segment);
  });

  const path = "/" + mapped.filter(Boolean).join("/");
  return path === "/" ? "/" : path.replace(/\/+/g, "/");
}

export function discoverRoutes(mockifyDir: string): DiscoveredRoute[] {
  const routes: DiscoveredRoute[] = [];

  function walk(currentDir: string): void {
    let entries: string[] = [];
    try {
      entries = readdirSync(currentDir);
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      if (!statSync(fullPath).isDirectory()) {
        continue;
      }

      const methodFiles = readdirSync(fullPath).filter((file) => {
        const method = file.split(".")[0]?.toUpperCase();
        return HTTP_METHODS.has(method);
      });

      for (const methodFile of methodFiles) {
        const method = methodFile.split(".")[0]!.toUpperCase();
        const relativeDir = relative(mockifyDir, fullPath);
        routes.push({
          method,
          path: dirToPath(relativeDir),
          file: join(relativeDir, methodFile),
        });
      }

      walk(fullPath);
    }
  }

  walk(mockifyDir);
  return routes.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
}
