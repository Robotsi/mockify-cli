export interface MockResponse {
  status?: number;
  headers?: Record<string, string>;
  body?: unknown;
}

export type MockHandler = (
  req: Request,
  params: Record<string, string>
) => Promise<MockResponse> | MockResponse;

export interface ProxyConfig {
  target: string;
  changeOrigin?: boolean;
}

export interface CorsConfig {
  enabled: boolean;
  origin: string;
}

export interface MockifyConfig {
  port: number;
  host: string;
  dir: string;
  cors: boolean | { origin?: string };
  proxy?: ProxyConfig;
  logLevel: "info" | "silent";
}

export interface JsonMockMetadata {
  status?: number;
  delay?: number;
}
