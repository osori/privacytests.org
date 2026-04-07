#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/srv/privacytests.org}"
SERVICE_USER="${SERVICE_USER:-$(id -un)}"
SERVICE_GROUP="${SERVICE_GROUP:-$(id -gn "$SERVICE_USER")}"
ENTRY_SITE_LABELS="${ENTRY_SITE_LABELS:-}"
SITE_LABELS="${SITE_LABELS:-:80}"
RESULTS_ROOT="${RESULTS_ROOT:-http://127.0.0.1}"
TEST_PAGES_ROOT_1="${TEST_PAGES_ROOT_1:-$RESULTS_ROOT}"
TEST_PAGES_ROOT_2="${TEST_PAGES_ROOT_2:-$RESULTS_ROOT}"
TEST_PAGES_ROOT_3="${TEST_PAGES_ROOT_3:-$TEST_PAGES_ROOT_2}"
UPGRADABLE_ROOT="${UPGRADABLE_ROOT:-http://127.0.0.1}"
INSECURE_ROOT_2="${INSECURE_ROOT_2:-http://127.0.0.1}"
INSECURE_ROOT_3="${INSECURE_ROOT_3:-http://127.0.0.1}"
HSTS_ROOT="${HSTS_ROOT:-https://127.0.0.1}"
TLS_ROOT="${TLS_ROOT:-https://127.0.0.1:8900}"
H1_ROOT="${H1_ROOT:-https://127.0.0.1:8901}"
H2_ROOT="${H2_ROOT:-https://127.0.0.1:8902}"
H3_ROOT="${H3_ROOT:-https://127.0.0.1:4434}"
ALTSVC_ROOT_2="${ALTSVC_ROOT_2:-https://127.0.0.1:4433}"
ALTSVC_ROOT_3="${ALTSVC_ROOT_3:-https://127.0.0.1:4435}"
ACME_EMAIL="${ACME_EMAIL:-}"
RUNTIME_ENV_PATH="${RUNTIME_ENV_PATH:-/etc/privacytests/privacytests.env}"
CADDYFILE_PATH="${CADDYFILE_PATH:-/etc/caddy/Caddyfile}"
LIVE_SYSTEMD_UNITS="${LIVE_SYSTEMD_UNITS:-privacytests-live-results.service privacytests-live-caching.service privacytests-live-params.service privacytests-live-tls.service privacytests-live-h1.service privacytests-live-h2.service}"
PROXY_SERVICE="${PROXY_SERVICE:-caddy}"
INSTALL_PACKAGES="${INSTALL_PACKAGES:-1}"
HELPER_CERTS_DIR="${HELPER_CERTS_DIR:-/etc/privacytests/certs}"

log() {
  printf '[provision] %s\n' "$*"
}

cleanup_temp_file() {
  local path="$1"
  if [ -n "$path" ] && [ -e "$path" ]; then
    rm -f "$path"
  fi
}

escape_sed_replacement() {
  printf '%s' "$1" | sed -e 's/[\/&]/\\&/g'
}

trim() {
  printf '%s' "$1" | xargs
}

origin_host() {
  local origin="$1"
  origin="${origin#http://}"
  origin="${origin#https://}"
  origin="${origin%%/*}"
  origin="${origin%%:*}"
  printf '%s' "$origin"
}

origin_hostport() {
  local origin="$1"
  origin="${origin#http://}"
  origin="${origin#https://}"
  origin="${origin%%/*}"
  printf '%s' "$origin"
}

http_and_https_labels() {
  local hostport
  hostport="$(origin_hostport "$1")"
  printf 'http://%s, https://%s' "$hostport" "$hostport"
}

https_cert_label() {
  local host
  host="$(origin_host "$1")"
  printf 'https://%s' "$host"
}

https_label() {
  local hostport
  hostport="$(origin_hostport "$1")"
  printf 'https://%s' "$hostport"
}

http_label() {
  local hostport
  hostport="$(origin_hostport "$1")"
  printf 'http://%s' "$hostport"
}

caddy_cert_source_dir() {
  local hostname="$1"
  sudo find /var/lib/caddy/.local/share/caddy/certificates -maxdepth 3 -type d -name "$hostname" 2>/dev/null | head -n 1
}

copy_helper_cert() {
  local origin="$1"
  local hostname source_dir

  hostname="$(origin_host "$origin")"
  source_dir="$(caddy_cert_source_dir "$hostname")"

  if [ -z "$source_dir" ]; then
    log "No Caddy certificate directory found yet for $hostname"
    return 1
  fi

  sudo install -d -m 755 "$HELPER_CERTS_DIR"
  sudo install -m 640 -o "$SERVICE_USER" -g "$SERVICE_GROUP" "$source_dir/$hostname.crt" "$HELPER_CERTS_DIR/$hostname.crt"
  sudo install -m 640 -o "$SERVICE_USER" -g "$SERVICE_GROUP" "$source_dir/$hostname.key" "$HELPER_CERTS_DIR/$hostname.key"
}

render_template() {
  local src="$1"
  local dest="$2"
  local tmp_rendered tmp_entrypoint_block

  local escaped_app_root escaped_service_user escaped_service_group
  local escaped_site_labels escaped_results_root escaped_test_pages_root_1
  local escaped_test_pages_root_2 escaped_test_pages_root_3 escaped_email_directive
  local escaped_upgradable_root escaped_insecure_root_2 escaped_insecure_root_3
  local escaped_hsts_root escaped_tls_root escaped_h1_root escaped_h2_root escaped_h3_root
  local escaped_altsvc_root_2 escaped_altsvc_root_3
  local escaped_upgradable_site_labels escaped_insecure_site_labels_2 escaped_insecure_site_labels_3
  local escaped_hsts_site_labels escaped_tls_cert_site_label escaped_h1_cert_site_label
  local escaped_h2_cert_site_label escaped_h3_site_label escaped_altsvc_site_label_2 escaped_altsvc_site_label_3

  escaped_app_root="$(escape_sed_replacement "$APP_ROOT")"
  escaped_service_user="$(escape_sed_replacement "$SERVICE_USER")"
  escaped_service_group="$(escape_sed_replacement "$SERVICE_GROUP")"
  escaped_site_labels="$(escape_sed_replacement "$SITE_LABELS")"
  escaped_results_root="$(escape_sed_replacement "$RESULTS_ROOT")"
  escaped_test_pages_root_1="$(escape_sed_replacement "$TEST_PAGES_ROOT_1")"
  escaped_test_pages_root_2="$(escape_sed_replacement "$TEST_PAGES_ROOT_2")"
  escaped_test_pages_root_3="$(escape_sed_replacement "$TEST_PAGES_ROOT_3")"
  escaped_upgradable_root="$(escape_sed_replacement "$UPGRADABLE_ROOT")"
  escaped_insecure_root_2="$(escape_sed_replacement "$INSECURE_ROOT_2")"
  escaped_insecure_root_3="$(escape_sed_replacement "$INSECURE_ROOT_3")"
  escaped_hsts_root="$(escape_sed_replacement "$HSTS_ROOT")"
  escaped_tls_root="$(escape_sed_replacement "$TLS_ROOT")"
  escaped_h1_root="$(escape_sed_replacement "$H1_ROOT")"
  escaped_h2_root="$(escape_sed_replacement "$H2_ROOT")"
  escaped_h3_root="$(escape_sed_replacement "$H3_ROOT")"
  escaped_altsvc_root_2="$(escape_sed_replacement "$ALTSVC_ROOT_2")"
  escaped_altsvc_root_3="$(escape_sed_replacement "$ALTSVC_ROOT_3")"
  escaped_upgradable_site_labels="$(escape_sed_replacement "$(http_and_https_labels "$UPGRADABLE_ROOT")")"
  escaped_insecure_site_labels_2="$(escape_sed_replacement "$(http_label "$INSECURE_ROOT_2")")"
  escaped_insecure_site_labels_3="$(escape_sed_replacement "$(http_label "$INSECURE_ROOT_3")")"
  escaped_hsts_site_labels="$(escape_sed_replacement "$(http_and_https_labels "$HSTS_ROOT")")"
  escaped_tls_cert_site_label="$(escape_sed_replacement "$(https_cert_label "$TLS_ROOT")")"
  escaped_h1_cert_site_label="$(escape_sed_replacement "$(https_cert_label "$H1_ROOT")")"
  escaped_h2_cert_site_label="$(escape_sed_replacement "$(https_cert_label "$H2_ROOT")")"
  escaped_h3_site_label="$(escape_sed_replacement "$(https_label "$H3_ROOT")")"
  escaped_altsvc_site_label_2="$(escape_sed_replacement "$(https_label "$ALTSVC_ROOT_2")")"
  escaped_altsvc_site_label_3="$(escape_sed_replacement "$(https_label "$ALTSVC_ROOT_3")")"

  if [ -n "$ACME_EMAIL" ]; then
    escaped_email_directive="$(escape_sed_replacement "  email $ACME_EMAIL")"
  else
    escaped_email_directive=""
  fi

  tmp_rendered="$(mktemp)"

  sed \
    -e "s|<REPO_ROOT>|$escaped_app_root|g" \
    -e "s|<SERVICE_USER>|$escaped_service_user|g" \
    -e "s|<SERVICE_GROUP>|$escaped_service_group|g" \
    -e "s|<SITE_LABELS>|$escaped_site_labels|g" \
    -e "s|<RESULTS_ROOT>|$escaped_results_root|g" \
    -e "s|<TEST_PAGES_ROOT_1>|$escaped_test_pages_root_1|g" \
    -e "s|<TEST_PAGES_ROOT_2>|$escaped_test_pages_root_2|g" \
    -e "s|<TEST_PAGES_ROOT_3>|$escaped_test_pages_root_3|g" \
    -e "s|<UPGRADABLE_ROOT>|$escaped_upgradable_root|g" \
    -e "s|<INSECURE_ROOT_2>|$escaped_insecure_root_2|g" \
    -e "s|<INSECURE_ROOT_3>|$escaped_insecure_root_3|g" \
    -e "s|<HSTS_ROOT>|$escaped_hsts_root|g" \
    -e "s|<TLS_ROOT>|$escaped_tls_root|g" \
    -e "s|<H1_ROOT>|$escaped_h1_root|g" \
    -e "s|<H2_ROOT>|$escaped_h2_root|g" \
    -e "s|<H3_ROOT>|$escaped_h3_root|g" \
    -e "s|<ALTSVC_ROOT_2>|$escaped_altsvc_root_2|g" \
    -e "s|<ALTSVC_ROOT_3>|$escaped_altsvc_root_3|g" \
    -e "s|<UPGRADABLE_SITE_LABELS>|$escaped_upgradable_site_labels|g" \
    -e "s|<INSECURE_SITE_LABELS_2>|$escaped_insecure_site_labels_2|g" \
    -e "s|<INSECURE_SITE_LABELS_3>|$escaped_insecure_site_labels_3|g" \
    -e "s|<HSTS_SITE_LABELS>|$escaped_hsts_site_labels|g" \
    -e "s|<TLS_CERT_SITE_LABEL>|$escaped_tls_cert_site_label|g" \
    -e "s|<H1_CERT_SITE_LABEL>|$escaped_h1_cert_site_label|g" \
    -e "s|<H2_CERT_SITE_LABEL>|$escaped_h2_cert_site_label|g" \
    -e "s|<H3_SITE_LABEL>|$escaped_h3_site_label|g" \
    -e "s|<ALTSVC_SITE_LABEL_2>|$escaped_altsvc_site_label_2|g" \
    -e "s|<ALTSVC_SITE_LABEL_3>|$escaped_altsvc_site_label_3|g" \
    -e "s|<CADDY_EMAIL_DIRECTIVE>|$escaped_email_directive|g" \
    "$src" > "$tmp_rendered"

  if [ -n "$ENTRY_SITE_LABELS" ]; then
    tmp_entrypoint_block="$(mktemp)"
    cat > "$tmp_entrypoint_block" <<EOF
$ENTRY_SITE_LABELS {
  import static_helper_host
}
EOF
    awk -v marker="<ENTRYPOINT_SITE_BLOCK>" -v block_file="$tmp_entrypoint_block" '
      $0 == marker {
        while ((getline line < block_file) > 0) {
          print line;
        }
        close(block_file);
        next;
      }
      { print }
    ' "$tmp_rendered" | sudo tee "$dest" >/dev/null
  else
    awk '
      $0 == "<ENTRYPOINT_SITE_BLOCK>" { next }
      { print }
    ' "$tmp_rendered" | sudo tee "$dest" >/dev/null
  fi

  cleanup_temp_file "$tmp_rendered"
  cleanup_temp_file "${tmp_entrypoint_block:-}"
}

proxy_curl_for_labels() {
  local labels="$1"
  local path="$2"
  local first_label host_header

  first_label="${labels%%,*}"
  first_label="$(trim "$first_label")"
  host_header="${first_label#http://}"
  host_header="${host_header#https://}"
  host_header="${host_header%%/*}"

  if [ -z "$host_header" ] || [[ "$host_header" == :* ]]; then
    curl -fsS --max-time 20 "http://127.0.0.1$path"
  else
    curl -kfsS --max-time 20 --resolve "$host_header:443:127.0.0.1" "https://$host_header$path"
  fi
}

proxy_curl() {
  proxy_curl_for_labels "$SITE_LABELS" "$1"
}

entry_proxy_curl() {
  if [ -n "$ENTRY_SITE_LABELS" ]; then
    proxy_curl_for_labels "$ENTRY_SITE_LABELS" "$1"
  else
    proxy_curl "$1"
  fi
}

proxy_results_health_check() {
  local body

  body="$(proxy_curl /healthz)"
  [[ "$body" == *'"ok":true'* ]] && [[ "$body" == *'"service":"results"'* ]]
}

wait_for_command() {
  local description="$1"
  shift

  local attempt
  for attempt in $(seq 1 30); do
    if "$@" >/dev/null 2>&1; then
      log "$description is ready"
      return 0
    fi
    sleep 2
  done

  log "$description did not become ready in time"
  "$@"
}

log "Ensuring deploy path exists"
sudo mkdir -p "$APP_ROOT"

if [ ! -f "$APP_ROOT/deploy/deploy.sh" ]; then
  log "deploy/deploy.sh not found under APP_ROOT: $APP_ROOT"
  exit 1
fi

if [ "$INSTALL_PACKAGES" = "1" ]; then
  log "Installing runtime packages"
  sudo apt-get update
  sudo apt-get install -y --no-install-recommends nodejs npm caddy
fi

log "Ensuring deploy path ownership"
sudo chown -R "$SERVICE_USER:$SERVICE_GROUP" "$APP_ROOT"

log "Writing runtime environment file"
sudo install -d -m 755 "$(dirname "$RUNTIME_ENV_PATH")"
sudo tee "$RUNTIME_ENV_PATH" >/dev/null <<EOF
RESULTS_ROOT=$RESULTS_ROOT
TEST_PAGES_ROOT_1=$TEST_PAGES_ROOT_1
TEST_PAGES_ROOT_2=$TEST_PAGES_ROOT_2
TEST_PAGES_ROOT_3=$TEST_PAGES_ROOT_3
UPGRADABLE_ROOT=$UPGRADABLE_ROOT
INSECURE_ROOT_2=$INSECURE_ROOT_2
INSECURE_ROOT_3=$INSECURE_ROOT_3
HSTS_ROOT=$HSTS_ROOT
TLS_ROOT=$TLS_ROOT
H1_ROOT=$H1_ROOT
H2_ROOT=$H2_ROOT
H3_ROOT=$H3_ROOT
ALTSVC_ROOT_2=$ALTSVC_ROOT_2
ALTSVC_ROOT_3=$ALTSVC_ROOT_3
HELPER_CERTS_DIR=$HELPER_CERTS_DIR
EOF

log "Installing systemd units"
for template in \
  "$APP_ROOT"/deploy/systemd/privacytests-live-*.service
do
  render_template "$template" "/etc/systemd/system/$(basename "$template")"
done
sudo install -m 644 "$APP_ROOT/deploy/systemd/privacytests-live.target" /etc/systemd/system/privacytests-live.target

log "Installing Caddy config"
render_template "$APP_ROOT/deploy/caddy/Caddyfile.template" "$CADDYFILE_PATH"

log "Reloading systemd"
sudo systemctl daemon-reload

log "Enabling proxy service"
sudo systemctl enable --now "$PROXY_SERVICE"

log "Enabling live services"
sudo systemctl enable $LIVE_SYSTEMD_UNITS

log "Running deploy script"
(
  cd "$APP_ROOT"
  chmod +x ./deploy/deploy.sh
  APP_ROOT="$APP_ROOT" \
  DEPLOY_SERVICES="$LIVE_SYSTEMD_UNITS" \
  PROXY_SERVICE="$PROXY_SERVICE" \
  ./deploy/deploy.sh
)

log "Syncing helper certificates from Caddy storage"
for helper_origin in "$TLS_ROOT" "$H1_ROOT" "$H2_ROOT"; do
  wait_for_command "certificate for $(origin_host "$helper_origin")" copy_helper_cert "$helper_origin"
done

log "Restarting raw TLS helper services after certificate sync"
for raw_service in privacytests-live-tls.service privacytests-live-h1.service privacytests-live-h2.service; do
  sudo systemctl restart "$raw_service"
done

log "Running smoke checks"
wait_for_command "results health" curl -fsS --max-time 20 http://127.0.0.1:3335/healthz
wait_for_command "proxy health" proxy_results_health_check
wait_for_command "entry page" entry_proxy_curl /me.html
wait_for_command "proxy static page" proxy_curl /supercookies.html
wait_for_command "proxy live resource" proxy_curl '/live/resource?type=image&key=provision-smoke'

log "Provisioning completed successfully."
