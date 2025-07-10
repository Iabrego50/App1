FROM node:18-alpine

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

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY src ./src
COPY tsconfig.json ./

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