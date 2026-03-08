FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

FROM deps AS builder
WORKDIR /app
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN pnpm --filter api... build

FROM node:20-alpine AS runner
RUN npm install -g pnpm
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/packages/shared/dist ./node_modules/@repo/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@repo/shared/package.json

COPY --from=builder /app/apps/api/dist ./apps/api/dist

RUN ln -s /app/node_modules/@repo/shared/dist /app/node_modules/@repo/shared/src

WORKDIR /app/apps/api

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "dist/server.js"]