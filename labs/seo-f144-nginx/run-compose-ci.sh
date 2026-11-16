#!/usr/bin/env bash
# SEO F144 — Docker Compose E2E in disposable GitHub Actions ONLY.
# No VPS, DNS, real Google, real redirects, customer data or billing.
set -euo pipefail
if [[ "${CI:-}" != "true" || "${GITHUB_ACTIONS:-}" != "true" ||
      "${APP_ENV:-}" != "testing" || "${SEO_F138_LOOPBACK_STAGING:-}" != "YES_I_CONTROL_THIS_LOOPBACK" ]]; then
  echo "SEO F144: disposable CI environment required" >&2
  exit 1
fi
repo_root="$(pwd)"
compose_file="$repo_root/labs/seo-f144-nginx/docker-compose.yml"
tempdir="$(mktemp -d)"
export SEO_F144_BUILD="$tempdir/dist"
export SEO_F144_CONF="$tempdir/nginx-valid.conf"
export COMPOSE_PROJECT_NAME="seo-f144-${GITHUB_RUN_ID:-ci}-${F144_NODE:-22}"
cleanup() {
  docker compose -f "$compose_file" down --volumes --remove-orphans >/dev/null 2>&1 || true
  rm -rf "$tempdir"
}
trap cleanup EXIT

node labs/seo-f144-nginx/create-synthetic-fixture.mjs "$tempdir"
# Exercise the F145 operator renderer against REAL compiled static assets,
# instead of using only the hand-authored good Nginx fixture.
node scripts/render-private-nginx-staging-config.mjs \
  --manifest "$tempdir/legacy-private.json" \
  --build "$tempdir/dist" \
  --out "$tempdir/nginx-rendered-from-manifest.conf" \
  > "$tempdir/rendered-sanitized-report.json"
node --input-type=module -e '
 import {readFileSync} from "node:fs";
 const r=JSON.parse(readFileSync(process.argv[1],"utf8"));
 if(r.reviewStatus!=="human_staging_proxy_review_required" ||
    r.redirectsRendered!==2 || r.productionReleaseAuthorized!==false)
   process.exit(1);
' "$tempdir/rendered-sanitized-report.json"
export SEO_F144_CONF="$tempdir/nginx-rendered-from-manifest.conf"
docker compose -f "$compose_file" config --quiet
docker compose -f "$compose_file" up -d --wait --no-build --pull always
address="$(docker compose -f "$compose_file" port nginx 8080)"
port="${address##*:}"
if [[ ! "$port" =~ ^[0-9]{4,5}$ ]]; then
  echo "SEO F144: no isolated loopback proxy port detected" >&2
  exit 1
fi
# The full gate includes GSC, build digest, actual HEAD 301 and actual GET HTML.
node scripts/run-served-html-staging-qa.mjs \
  --gsc "$tempdir/gsc-private.json" \
  --manifest "$tempdir/legacy-private.json" \
  --build "$tempdir/dist" \
  --out "$tempdir/valid-private-receipts.json" \
  --port "$port" \
  --enable-loopback-probe > "$tempdir/valid-sanitized-report.json"
node --input-type=module -e '
 import {readFileSync} from "node:fs";
 const r=JSON.parse(readFileSync(process.argv[1],"utf8"));
 if(r.reviewStatus!=="human_independent_served_html_staging_review_required" ||
    r.summary.identicalServedHtmlRoutes!==2 ||
    r.summary.validHttp301Receipts!==2 ||
    r.buildDigestMatchedInLocalProxy!==true ||
    r.productionReleaseAuthorized!==false)process.exit(1);
' "$tempdir/valid-sanitized-report.json"

# Recreate a separate Nginx instance with the SAME SHA header but wrong HTML
# at /en/. The integrated gate MUST detect the mismatch by GET bytes.
docker compose -f "$compose_file" down --volumes --remove-orphans >/dev/null
export SEO_F144_CONF="$tempdir/nginx-stale-content.conf"
docker compose -f "$compose_file" config --quiet
docker compose -f "$compose_file" up -d --wait --no-build --pull never
address="$(docker compose -f "$compose_file" port nginx 8080)"
port="${address##*:}"
if [[ ! "$port" =~ ^[0-9]{4,5}$ ]]; then
  echo "SEO F144: no isolated negative-case port detected" >&2
  exit 1
fi
set +e
node scripts/run-served-html-staging-qa.mjs \
  --gsc "$tempdir/gsc-private.json" \
  --manifest "$tempdir/legacy-private.json" \
  --build "$tempdir/dist" \
  --out "$tempdir/bad-private-receipts.json" \
  --port "$port" \
  --enable-loopback-probe > "$tempdir/bad-sanitized-report.json"
status="$?"
set -e
if [[ "$status" != "2" ]]; then
  echo "SEO F144: stale HTML was not blocked" >&2
  exit 1
fi
node --input-type=module -e '
 import {readFileSync} from "node:fs";
 const r=JSON.parse(readFileSync(process.argv[1],"utf8"));
 if(r.reviewStatus!=="blocked" ||
    !r.blockedComponents.includes("served_html_bytes_differ_from_audited_build") ||
    r.summary.alteredServedHtmlRoutes!==1 ||
    r.buildDigestMatchedInLocalProxy!==true ||
    r.productionReleaseAuthorized!==false)process.exit(1);
' "$tempdir/bad-sanitized-report.json"
# F146 — isolate a CONFIG-ONLY rollback drill. The approved generated
# Nginx configuration must have remained byte-identical while the bad config
# was active. Recreate the service and prove the complete F143 check is green.
docker compose -f "$compose_file" down --volumes --remove-orphans >/dev/null
export SEO_F144_CONF="$tempdir/nginx-rendered-from-manifest.conf"
docker compose -f "$compose_file" config --quiet
docker compose -f "$compose_file" up -d --wait --no-build --pull never
address="$(docker compose -f "$compose_file" port nginx 8080)"
port="${address##*:}"
if [[ ! "$port" =~ ^[0-9]{4,5}$ ]]; then
  echo "SEO F146: rollback did not expose an isolated loopback port" >&2
  exit 1
fi
node scripts/run-served-html-staging-qa.mjs \
  --gsc "$tempdir/gsc-private.json" \
  --manifest "$tempdir/legacy-private.json" \
  --build "$tempdir/dist" \
  --out "$tempdir/rollback-private-receipts.json" \
  --port "$port" \
  --enable-loopback-probe > "$tempdir/rollback-sanitized-report.json"
node --input-type=module -e '
 import {readFileSync} from "node:fs";
 const r=JSON.parse(readFileSync(process.argv[1],"utf8"));
 if(r.reviewStatus!=="human_independent_served_html_staging_review_required" ||
    r.summary.identicalServedHtmlRoutes!==2 ||
    r.summary.validHttp301Receipts!==2 ||
    r.buildDigestMatchedInLocalProxy!==true ||
    r.productionReleaseAuthorized!==false)process.exit(1);
' "$tempdir/rollback-sanitized-report.json"
# Never print private fixture files or detailed Nginx logs into public CI.
echo "SEO F146: isolated Nginx valid -> invalid HOLD -> original config restored and verified"
