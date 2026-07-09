# Stage 1: Build the React application using Vite
FROM node:22-alpine AS builder
WORKDIR /app

# Copy only package.json to avoid Windows lockfile conflicts with Linux native bindings
COPY package.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the app for production (this will create a 'dist' folder)
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# Remove default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy the built Vite output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Add a basic Nginx configuration to support React Router (SPA Fallback)
RUN echo "server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files \$uri \$uri/ /index.html; \
    } \
}" > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
