# Use official Node.js LTS
FROM node:18-alpine

# Set work directory
WORKDIR /app

# Copy package.json and package-lock.json if it exists
COPY package*.json ./

# Install all dependencies (not just production for now, helps with ESM)
RUN npm install

# Copy all source code
COPY . .

# Expose API port
EXPOSE 3000

# Set environment variable
ENV NODE_ENV=production

# Start the app
CMD ["node", "server.js"]
