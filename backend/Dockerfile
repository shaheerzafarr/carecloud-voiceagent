# Dockerfile for CareCloud Voice Agent NestJS Application

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package definition files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source files
COPY . .

# Build production bundle
RUN npm run build

# --- Production Runner Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package definition files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built dist files and views/public directories
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/views ./views
COPY --from=builder /app/public ./public
COPY --from=builder /app/env ./env

EXPOSE 8000 5006 5008

CMD ["node", "dist/src/main.js"]
