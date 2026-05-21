#!/bin/sh
# Inject runtime environment variables ke index.html yang sudah di-build
# Ini diperlukan karena React apps are compiled static — env harus diinjek saat runtime

FARO_URL="${FARO_COLLECTOR_URL:-/faro/collect}"

echo "→ Injecting FARO_COLLECTOR_URL: ${FARO_URL}"

# Replace placeholder di semua file HTML
find /usr/share/nginx/html -name "*.html" -exec \
  sed -i "s|%FARO_COLLECTOR_URL%|${FARO_URL}|g" {} \;

echo "→ Runtime injection selesai, starting nginx..."
exec "$@"
