# Use official Node.js LTS
FROM node:18-alpine

# Set work directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Install nodemon globally (for live reload)
RUN npm install -g nodemon

# Copy all source code
COPY . .

# Expose API port
EXPOSE 3000

# Start app with nodemon for development
CMD ["nodemon", "server.js"]
