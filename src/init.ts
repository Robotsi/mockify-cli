import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const SCAFFOLD: Array<{ path: string; content: string }> = [
  {
    path: "index/GET.json",
    content: JSON.stringify(
      {
        message: "Welcome to Mockify!",
        docs: "https://github.com/Robotsi/mockify-cli",
      },
      null,
      2
    ),
  },
  {
    path: "users/GET.json",
    content: JSON.stringify(
      {
        status: "success",
        data: [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
        ],
      },
      null,
      2
    ),
  },
  {
    path: "users/[id]/GET.json",
    content: JSON.stringify(
      {
        status: "success",
        data: { id: "{{id}}", name: "Mock User" },
      },
      null,
      2
    ),
  },
  {
    path: "users/POST.ts",
    content: `import type { MockHandler } from "mockify-cli";

const handle: MockHandler = async (req) => {
  const body = await req.json();

  if (!body.email || !body.password) {
    return {
      status: 400,
      body: { error: "Email and password are required." },
    };
  }

  return {
    status: 201,
    headers: { "X-Custom-Header": "UserRegistered" },
    body: {
      success: true,
      id: Math.floor(Math.random() * 1000),
      email: body.email,
    },
  };
};

export default handle;
`,
  },
];

export function initMockifyDirectory(cwd = process.cwd(), dir = ".mockify"): string {
  const mockifyDir = join(cwd, dir);

  if (existsSync(mockifyDir)) {
    throw new Error(`Directory already exists: ${mockifyDir}`);
  }

  mkdirSync(mockifyDir, { recursive: true });

  for (const file of SCAFFOLD) {
    const filePath = join(mockifyDir, file.path);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, file.content, "utf-8");
  }

  return mockifyDir;
}
