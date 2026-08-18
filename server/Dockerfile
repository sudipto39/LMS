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

# Install production-only dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled output from the builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 8080

CMD ["node", "dist/index.js"]
