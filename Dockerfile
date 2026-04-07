# ─── STAGE 1: Build & Test ───────────────────────────────────────────────────
# Use a full Node image to install ALL deps (including devDependencies)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first — Docker caches this layer
# so `npm install` only re-runs when package.json changes
COPY package*.json ./
RUN npm ci

# Copy source code and run tests inside the build stage
COPY . .
RUN npm test

# ─── STAGE 2: Production Image ───────────────────────────────────────────────
# Start fresh from a minimal image — no test libs, no build tools
FROM node:20-alpine AS production

# Set the environment
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Only install production deps in the final image
COPY package*.json ./
RUN npm ci --only=production

# Copy only the source code (not tests) from the builder stage
COPY --from=builder /app/src ./src

# Run as non-root for security best practice
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

# Healthcheck so Docker and orchestrators know if the app is alive
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
