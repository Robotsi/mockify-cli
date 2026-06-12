FROM oven/bun:1.2-alpine

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production

COPY . .
RUN bun run build

EXPOSE 4500

ENTRYPOINT ["node", "./dist/cli.js", "start", "--host", "0.0.0.0", "--port", "4500"]
