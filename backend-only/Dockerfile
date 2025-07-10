FROM node:18-alpine

# Add build argument to force clean builds
ARG BUILD_DATE=unknown
ARG VCS_REF=unknown

WORKDIR /app

# Install system dependencies for canvas and other native modules
RUN apk add --no-cache \
    python3 \
    python3-dev \
    py3-setuptools \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

# Copy package files from server directory
COPY server/package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci --include=dev

# Copy source code from server directory
COPY server/src ./src
COPY server/tsconfig.json ./

# Build the application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Create uploads directory
RUN mkdir -p uploads/images uploads/videos uploads/documents uploads/thumbnails

# Copy startup script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Start the application
CMD ["./start.sh"] 