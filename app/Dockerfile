# ── Stage 1: Build ─────────────────────────────────────────────────────────
# Pakai node:18 — react-scripts@5 tidak kompatibel penuh dengan node:20
# (ajv/dist/compile/codegen conflict di node 20)
FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json ./

# Install dependencies + fix ajv yang missing di react-scripts@5 + node 18
RUN npm install --legacy-peer-deps && \
    npm install ajv@^8.0.0 --legacy-peer-deps

COPY public/ ./public/
COPY src/ ./src/

RUN npm run build

# ── Stage 2: Serve via nginx ────────────────────────────────────────────────
FROM nginx:1.25-alpine

# Copy build artifacts
COPY --from=builder /app/build /usr/share/nginx/html

# Nginx config — proxy /collect → alloy untuk menghindari CORS issue
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Entrypoint: replace %FARO_COLLECTOR_URL% placeholder dengan env var
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]