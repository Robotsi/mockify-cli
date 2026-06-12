# Hafif bir Bun imajı taban alıyoruz
FROM oven/bun:1.2-alpine

# Konteyner içindeki çalışma dizini
WORKDIR /app

# Bağımlılıkları optimize şekilde kopyala ve kur
COPY package.json bun.lockb* ./
RUN bun install --production

# Proje kodlarını ve derlenmiş halini kopyala
COPY . .

# Projeyi derle (dist/cli.js oluşsun)
RUN bun run build

# Mockify varsayılan olarak 4500 portundan dışarı açılacak
EXPOSE 4500

# Konteyner ayağa kalktığında çalışacak ana komut
ENTRYPOINT ["bun", "./dist/cli.js", "start", "--port", "4500"]