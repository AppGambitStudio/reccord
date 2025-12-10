FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
ARG BACKEND_URL
RUN npm run build

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
