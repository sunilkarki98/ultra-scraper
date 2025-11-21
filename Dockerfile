# FIXED: Updated version to match your package.json (1.56.1)
FROM mcr.microsoft.com/playwright:v1.56.1-jammy

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

# Set Environment
ENV NODE_ENV=production

# Expose API port (Documentation only for Railway)
EXPOSE 3000

# Start command
CMD ["node", "dist/index.js"]