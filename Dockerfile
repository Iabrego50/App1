FROM node:18-alpine

# Install build dependencies for canvas
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

WORKDIR /app

# Copy package files
COPY server/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY server/src ./src
COPY server/tsconfig.json ./

# Build the application
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads/images uploads/videos uploads/documents uploads/thumbnails

# Expose port
EXPOSE 5000

# Set environment variable
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"] 