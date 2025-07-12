FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application (optional - can be overridden)
RUN npm run build || true

# Expose default port (can be overridden)
EXPOSE 3000

# Default command (can be overridden)
CMD ["npm", "run", "start"] 