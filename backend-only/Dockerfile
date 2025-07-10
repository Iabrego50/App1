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

# Copy and set up startup script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Expose port (Railway will set the actual port)
EXPOSE 5000

# Start the application using the startup script
CMD ["./start.sh"] 