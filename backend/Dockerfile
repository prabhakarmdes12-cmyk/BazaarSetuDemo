# Chiti Bazaar backend — production image.
#
# Builds the TypeScript to dist/, swaps the Prisma provider from SQLite
# (dev) to PostgreSQL (prod), and runs `db push` on boot so the schema is
# applied to whatever DATABASE_URL the host provides.

FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma ./prisma
COPY scripts ./scripts
COPY src ./src

# Dev/test use SQLite; prod images are built for PostgreSQL. `prisma generate`
# bakes the provider into the generated client.
RUN BAZAARSETU_PRISMA_PROVIDER=postgresql node scripts/prepare-prisma-provider.cjs \
  && npx prisma generate \
  && npm run build

FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# Already PostgreSQL-adjusted schema for the boot-time `db push`.
COPY --from=build /app/prisma ./prisma

# Static uploads dir referenced by /uploads (files themselves live on a
# volume in real deploys).
RUN mkdir -p uploads

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/api/health || exit 1

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]
