# syntax=docker/dockerfile:1

# Stage 1: compile TypeScript. Has dev dependencies and the compiler.
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Development (06.05): the build stage plus a watcher. Node 22 runs TypeScript directly by
# stripping the types, so edits restart the server with no compile step. Build with --target dev.
FROM build AS dev
ENV NODE_ENV=development
CMD ["node", "--watch", "src/server.ts"]

# Stage 2: what actually ships. Production dependencies and compiled JS only.
FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
# slim has no curl, so ask Node to call /healthz. Exit 0 = healthy, 1 = unhealthy.
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "-e", "fetch(`http://127.0.0.1:${process.env.PORT || 3000}/healthz`).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["node", "dist/server.js"]
