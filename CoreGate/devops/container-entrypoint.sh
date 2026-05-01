#!/bin/sh
set -eu

CERT_DIR="/app/certs"
SIGNING_CERT_PATH="${OIDC_SIGNING_CERTIFICATE_PATH:-$CERT_DIR/oidc-signing.pfx}"
ENCRYPTION_CERT_PATH="${OIDC_ENCRYPTION_CERTIFICATE_PATH:-$CERT_DIR/oidc-encryption.pfx}"

require_env() {
  var_name="$1"
  eval "var_value=\${$var_name:-}"
  if [ -z "$var_value" ]; then
    echo "Required environment variable '$var_name' is not set."
    exit 1
  fi
}

write_certificate() {
  base64_value="$1"
  output_path="$2"

  mkdir -p "$(dirname "$output_path")"
  umask 077
  printf '%s' "$base64_value" | base64 -d > "$output_path"
}

require_env OIDC_SIGNING_CERTIFICATE_BASE64
require_env OIDC_ENCRYPTION_CERTIFICATE_BASE64

write_certificate "$OIDC_SIGNING_CERTIFICATE_BASE64" "$SIGNING_CERT_PATH"
write_certificate "$OIDC_ENCRYPTION_CERTIFICATE_BASE64" "$ENCRYPTION_CERT_PATH"

exec dotnet OpenSaur.CoreGate.Web.dll
