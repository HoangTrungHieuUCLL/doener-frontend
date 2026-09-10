# ---- Build stage ---------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# VITE_API_BASE_URL must be supplied as a Docker build ARG (Railway sets
# build-time variables this way) and re-exported as an ENV so Vite's define
# pipeline can inline it into the bundle via import.meta.env.VITE_API_BASE_URL.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Runtime stage: slim static file server -------------------------------
FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
