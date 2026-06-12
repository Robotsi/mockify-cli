import { readFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
export const isBun = typeof Bun !== "undefined";

export type FetchHandler = (req: Request) => Response | Promise<Response>;

export async function readTextFile(filePath: string): Promise<string> {
  if (isBun) {
    return Bun.file(filePath).text();
  }
  return readFile(filePath, "utf-8");
}

export async function importScript(filePath: string): Promise<Record<string, unknown>> {
  if (isBun) {
    return import(`${filePath}?update=${Date.now()}`);
  }

  const { createJiti } = await import("jiti");
  const jiti = createJiti(import.meta.url, { moduleCache: false });
  return jiti(filePath) as Record<string, unknown>;
}

async function readBody(req: IncomingMessage): Promise<Buffer | undefined> {
  if (req.method === "GET" || req.method === "HEAD") {
    return undefined;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function nodeToWebRequest(req: IncomingMessage, host: string, port: number): Request {
  const protocol = "http";
  const url = `${protocol}://${host}:${port}${req.url ?? "/"}`;
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach((entry) => headers.append(key, entry));
      } else {
        headers.set(key, value);
      }
    }
  }

  return new Request(url, {
    method: req.method,
    headers,
    duplex: "half",
  } as RequestInit);
}

async function sendWebResponse(webRes: Response, res: ServerResponse): Promise<void> {
  res.statusCode = webRes.status;

  webRes.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (webRes.body) {
    const buffer = Buffer.from(await webRes.arrayBuffer());
    res.end(buffer);
    return;
  }

  res.end();
}

function startNodeServer(host: string, port: number, handler: FetchHandler) {
  const server = createServer(async (req, res) => {
    try {
      const body = await readBody(req);
      const webReq = nodeToWebRequest(req, host, port);

      let request = webReq;
      if (body && body.length > 0) {
        request = new Request(webReq, { body: new Uint8Array(body) });
      }

      const webRes = await handler(request);
      await sendWebResponse(webRes, res);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: message }));
    }
  });

  server.listen(port, host);
  return server;
}

export function startHttpServer(
  host: string,
  port: number,
  handler: FetchHandler
): { stop?: () => void } {
  if (isBun) {
    const server = Bun.serve({ hostname: host, port, fetch: handler });
    return { stop: () => server.stop() };
  }

  const server = startNodeServer(host, port, handler);
  return {
    stop: () => {
      server.close();
    },
  };
}
