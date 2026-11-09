




FROM node:20-alpine AS builder

WORKDIR /app


RUN apk add --no-cache python3 make g++ sqlite-dev


RUN npm install -g pnpm@11.25.0


COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install


COPY . .
RUN pnpm approve-builds --all || true
RUN pnpm run build


RUN pnpm prune --prod



FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4321
ENV HOST=0.0.0.0


RUN apk add --no-cache curl


USER node


RUN mkdir -p /app/data /app/data/uploads /app/backups


COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/scripts ./scripts
COPY --chown=node:node --from=builder /app/src/db/schema.sql ./src/db/schema.sql


EXPOSE 4321


HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4321/healthz || exit 1


CMD ["node", "./dist/server/entry.mjs"]
