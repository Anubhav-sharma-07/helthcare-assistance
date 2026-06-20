# Stage 1: Build React Application
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
# Prevent peer dependency conflicts during container packaging
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Stage 2: Serve static content with Nginx
FROM nginx:alpine

# Copy compiled assets from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
