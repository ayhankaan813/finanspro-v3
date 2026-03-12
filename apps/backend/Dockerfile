# ── Stage 1: Builder ──
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# Copy package files & prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# ── Stage 2: Production ──
FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package files & prisma
COPY package*.json ./
COPY prisma ./prisma/

# Install production deps only
RUN npm ci --omit=dev

# Generate Prisma client (prod)
RUN npx prisma generate

# Copy built JS from builder
COPY --from=builder /app/dist ./dist

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["npm", "run", "start:prod"]
