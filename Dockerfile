# =================================================================
# GoMate Production Dockerfile
# Node.js 22 LTS | Baileys Multi-Device WhatsApp | Optimised for Render/Railway
# =================================================================

FROM node:22-slim

# Install minimal system dependencies for Baileys WebSocket TLS + fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Environment defaults
ENV NODE_ENV=production \
    PORT=3000 \
    NODE_TLS_REJECT_UNAUTHORIZED=0

# Create a non-root app user for security
RUN groupadd -r gomate && useradd -r -g gomate -m -d /home/gomate gomate

# Set working directory
WORKDIR /usr/src/app

# Copy dependency manifests first (for Docker layer caching)
COPY package*.json ./

# Install production dependencies (skip dev tools)
RUN npm ci --only=production --prefer-offline

# Copy application source code
COPY . .

# Create persistent directories for Baileys auth and logs
RUN mkdir -p .baileys_auth logs && chown -R gomate:gomate /usr/src/app

# Switch to non-root user
USER gomate

# Expose HTTP port
EXPOSE 3000

# Health check (wait up to 40s for Baileys init on cold start)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start production server
CMD ["node", "server.js"]
