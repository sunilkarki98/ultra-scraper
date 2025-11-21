# Use official Playwright image to ensure browser deps are present
FROM mcr.microsoft.com/playwright:v1.49.0-jammy

# Set working directory
WORKDIR /app

# Copy package definitions
COPY package*.json ./

# Install dependencies (including dev deps for build)
RUN npm ci

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Remove dev dependencies to slim down (optional, but safe in Node)
# RUN npm prune --production 

# Create non-root user (Playwright image has 'pwuser', usually)
# But we will run as root inside container to avoid permission headaches with Puppeteer/Playwright
# unless specifically configured for user-space.
# For best security, map to a specific user in docker-compose or k8s.

ENV NODE_ENV=production

# Expose API port
EXPOSE 3000

# Start command
CMD ["node", "dist/index.js"]