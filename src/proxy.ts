import type { ProxyConfig } from "./types";

export async function proxyRequest(req: Request, config: ProxyConfig): Promise<Response> {
  const requestUrl = new URL(req.url);
  const targetBase = new URL(config.target);
  const targetUrl = new URL(requestUrl.pathname + requestUrl.search, targetBase);

  const headers = new Headers(req.headers);
  if (config.changeOrigin !== false) {
    headers.set("host", targetUrl.host);
  }

  const method = req.method;
  const body =
    method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer();

  const upstream = await fetch(targetUrl, {
    method,
    headers,
    body: body && body.byteLength > 0 ? body : undefined,
    redirect: "manual",
  });

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
  });
}
