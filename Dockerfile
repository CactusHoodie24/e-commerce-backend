# Use official Node.js LTS
FROM node:18-alpine

# Set work directory
WORKDIR /app

# Copy dependency files first
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy all source code
COPY . .

# Expose API port
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]
