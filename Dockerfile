FROM node:20-slim AS base
RUN npm install -g pnpm@9

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/
RUN pnpm install --frozen-lockfile

# Copy source
COPY tsconfig.base.json ./
COPY packages/shared/ packages/shared/
COPY packages/server/ packages/server/
COPY packages/client/ packages/client/

# Build client (static files)
RUN pnpm --filter client build

# Build server (TypeScript → JavaScript)
RUN pnpm --filter server build

# Production stage — smaller image
FROM node:20-slim AS production
RUN npm install -g pnpm@9

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/

RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts
COPY --from=base /app/packages/shared/ packages/shared/
COPY --from=base /app/packages/server/dist/ packages/server/dist/
COPY --from=base /app/packages/client/dist/ packages/client/dist/

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "packages/server/dist/index.js"]
