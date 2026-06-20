# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json ./
# Use npm install (no lockfile committed) to keep the image build self-contained.
RUN npm install

COPY . .

# VITE_API_BASE_URL is baked in at build time. Leave empty to use same-origin
# '/api' (default), which nginx proxies to the backend.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ---------- Serve stage ----------
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# BACKEND_URL is substituted into the nginx template at container start so the
# same image works locally (docker-compose) and in the cloud.
ENV PROXY_SCHEME=http
ENV BACKEND_URL=backend:8000
ENV PORT=80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
