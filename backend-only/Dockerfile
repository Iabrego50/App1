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

# Set default port
ENV PORT=5000

# Expose port
EXPOSE $PORT

# Start the application
CMD ["npm", "start"] 