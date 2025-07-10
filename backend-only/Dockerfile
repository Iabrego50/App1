FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build the application
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads/images uploads/videos uploads/documents uploads/thumbnails

# Copy startup script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Start the application
CMD ["./start.sh"] 