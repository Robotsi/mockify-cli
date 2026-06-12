import type { MockHandler } from "mockify-cli";

const handle: MockHandler = async (req) => {
  const body = await req.json();

  if (!body.title) {
    return { status: 400, body: { error: "Title is required" } };
  }

  return {
    status: 201,
    body: {
      id: Math.floor(Math.random() * 10000),
      title: body.title,
      done: false,
    },
  };
};

export default handle;
