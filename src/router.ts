import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export function matchDynamicRoute(
  mockifyDir: string,
  pathname: string
): { filePath: string; params: Record<string, string> } | null {
  const segments = pathname.split("/").filter(Boolean);

  function scan(
    currentDir: string,
    segmentIndex: number,
    currentParams: Record<string, string>
  ): string | null {
    if (segmentIndex === segments.length) {
      return currentDir;
    }

    const currentSegment = segments[segmentIndex];

    try {
      const items = readdirSync(currentDir);

      if (items.includes(currentSegment)) {
        const nextDir = join(currentDir, currentSegment);
        if (statSync(nextDir).isDirectory()) {
          const result = scan(nextDir, segmentIndex + 1, currentParams);
          if (result) return result;
        }
      }

      for (const item of items) {
        if (!item.startsWith("[") || !item.endsWith("]")) {
          continue;
        }

        const nextDir = join(currentDir, item);
        if (!statSync(nextDir).isDirectory()) {
          continue;
        }

        if (item.startsWith("[...") && item.endsWith("]")) {
          const paramName = item.slice(4, -1);
          currentParams[paramName] = segments.slice(segmentIndex).join("/");
          return nextDir;
        }

        const paramName = item.slice(1, -1);
        currentParams[paramName] = currentSegment;

        const result = scan(nextDir, segmentIndex + 1, currentParams);
        if (result) return result;

        delete currentParams[paramName];
      }
    } catch {
      return null;
    }

    return null;
  }

  const params: Record<string, string> = {};
  const matchedDir = scan(mockifyDir, 0, params);

  if (matchedDir) {
    return { filePath: matchedDir, params };
  }

  return null;
}
