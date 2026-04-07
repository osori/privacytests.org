#!/usr/bin/env bash
set -euo pipefail

# Idempotent mirror deployment script.
# Optional environment variables:
# - APP_ROOT (default: current directory)
# - DEPLOY_SERVICES (space-separated systemd units to restart)
# - PROXY_SERVICE (proxy unit to reload, default: caddy)
# - INSTALL_NODE_DEPS (default: 1)
# - INSTALL_PYTHON_DEPS (default: 0)
# - NODE_PACKAGE_DIRS (space-separated package directories to install)

APP_ROOT="${APP_ROOT:-$(pwd)}"
DEPLOY_SERVICES="${DEPLOY_SERVICES:-}"
PROXY_SERVICE="${PROXY_SERVICE:-caddy}"
INSTALL_NODE_DEPS="${INSTALL_NODE_DEPS:-1}"
INSTALL_PYTHON_DEPS="${INSTALL_PYTHON_DEPS:-0}"
NODE_PACKAGE_DIRS="${NODE_PACKAGE_DIRS:-live scripts}"

log() {
  printf '[deploy] %s\n' "$*"
}

run_if_exists() {
  local cmd="$1"
  if command -v "$cmd" >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

install_node_dependencies() {
  local dir="$1"
  local package_dir="$APP_ROOT"

  if [ "$dir" != "." ]; then
    package_dir="$APP_ROOT/$dir"
  fi

  if [ ! -f "$package_dir/package.json" ]; then
    log "Skipping Node dependency install in $dir (no package.json)."
    return 0
  fi

  if [ -f "$package_dir/package-lock.json" ] && run_if_exists npm; then
    log "Installing Node dependencies in $dir with npm ci"
    (cd "$package_dir" && npm ci --omit=dev --no-audit --no-fund)
  elif [ -f "$package_dir/pnpm-lock.yaml" ] && run_if_exists pnpm; then
    log "Installing Node dependencies in $dir with pnpm install"
    (cd "$package_dir" && pnpm install --frozen-lockfile --prod)
  elif [ -f "$package_dir/yarn.lock" ] && run_if_exists yarn; then
    log "Installing Node dependencies in $dir with yarn install"
    (cd "$package_dir" && yarn install --frozen-lockfile --production)
  elif run_if_exists npm; then
    log "Installing Node dependencies in $dir with npm install"
    (cd "$package_dir" && npm install --omit=dev --no-audit --no-fund)
  else
    log "Skipping Node dependency install in $dir (missing supported package manager)."
  fi
}

cd "$APP_ROOT"
log "Starting deploy in $APP_ROOT"

if [ "$INSTALL_NODE_DEPS" = "1" ]; then
  for dir in $NODE_PACKAGE_DIRS; do
    install_node_dependencies "$dir"
  done
fi

if [ "$INSTALL_PYTHON_DEPS" = "1" ] && [ -f requirements.txt ] && run_if_exists python3; then
  log "Installing Python dependencies"
  python3 -m pip install --upgrade -r requirements.txt
fi

if [ -n "$DEPLOY_SERVICES" ] && run_if_exists systemctl; then
  for service in $DEPLOY_SERVICES; do
    log "Restarting service: $service"
    sudo systemctl restart "$service"
  done
else
  log "No DEPLOY_SERVICES provided; skipping app service restart."
fi

if run_if_exists systemctl; then
  if systemctl list-unit-files | awk '{print $1}' | grep -qx "${PROXY_SERVICE}.service"; then
    log "Reloading proxy service: $PROXY_SERVICE"
    sudo systemctl reload "$PROXY_SERVICE"
  else
    log "Proxy service '${PROXY_SERVICE}' not found; skipping reload."
  fi
else
  log "systemctl unavailable; skipping proxy reload."
fi

log "Deploy completed successfully."
