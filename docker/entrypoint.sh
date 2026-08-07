#!/bin/sh
set -eu

cat > /usr/share/nginx/html/runtime-config.js <<EOF
window.__BASE44_RUNTIME_CONFIG__ = {
  appId: "${VITE_BASE44_APP_ID:-}",
  appBaseUrl: "${VITE_BASE44_APP_BASE_URL:-}",
  functionsVersion: "${VITE_BASE44_FUNCTIONS_VERSION:-}",
};
EOF

exec nginx -g 'daemon off;'
