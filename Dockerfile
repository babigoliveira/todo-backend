FROM oven/bun

WORKDIR /app

COPY . .

RUN bun install

EXPOSE 33333

CMD ["bun", "run", "index.ts"]
