
# --- Stage 1: Build -----------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Build-time placeholder for Prisma client type generation
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# Install ALL deps (including devDeps needed for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source files
COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./
COPY prisma.config.ts ./

# Generate Prisma client, compile TypeScript, copy generated types
RUN npx prisma generate
RUN npx tsc
RUN cp -r src/generated dist/generated

# --- Stage 2: Production Runtime ----------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# Cloud Run injects PORT=8080 - this sets a safe default
ENV PORT=8080

# ── Language runtimes for localRunnerService fallback ─────────────────────────
# Used when Judge0 CE is unreachable or returns Internal Error (status >= 13)
RUN apk add --no-cache \
    python3 \
    gcc \
    g++ \
    openjdk17-jre \
    && ln -sf python3 /usr/bin/python \
    && rm -rf /var/cache/apk/*

# Install production-only dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled output from the builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 8080

CMD ["node", "dist/index.js"]
