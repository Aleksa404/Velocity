# ============================================
# Stage 1: Build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first (better cache)
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDependencies for building)
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code and build
COPY src ./src
RUN npm run build

# ============================================
# Stage 2: Production
# ============================================
FROM node:20-alpine

# Install system ffmpeg (the npm ffmpeg-static package ships glibc binaries
# that are incompatible with Alpine's musl libc — using apk ffmpeg instead)
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy dependency manifests and install production-only deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy Prisma schema and regenerate client for production
COPY prisma ./prisma/
RUN npx prisma generate

# Copy compiled JS from build stage
COPY --from=builder /app/dist ./dist

# Create persistent directories for file uploads and video storage
RUN mkdir -p uploads videos

# Tell fluent-ffmpeg to use the system binary instead of ffmpeg-static
ENV FFMPEG_PATH=/usr/bin/ffmpeg

# Expose application port
EXPOSE 5000

# Health check — verifies the /api/health endpoint responds with 200
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

# Start the server
CMD ["npm", "start"]
