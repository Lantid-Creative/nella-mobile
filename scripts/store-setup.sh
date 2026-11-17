#!/usr/bin/env bash
#
# Connects the App Store and Play accounts to this repository.
#
# Run it once, after you have created the API key in App Store Connect and the
# service account in Google Play Console. It writes the credentials straight
# into GitHub Actions secrets — nothing is stored in the repository and nothing
# sensitive is echoed back.
#
#   bash scripts/store-setup.sh
#
set -euo pipefail

bold() { printf '\n\033[1m%s\033[0m\n' "$1"; }
ask() { local out; read -r -p "$1: " out; printf '%s' "$out"; }

bold "Checking GitHub CLI"
if ! gh auth status >/dev/null 2>&1; then
  echo "  gh is not authenticated. Run: gh auth login" >&2
  exit 1
fi
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "  connected to $REPO"

bold "App Store Connect"
echo "  Create the key at appstoreconnect.apple.com → Users and Access →"
echo "  Integrations → Team Keys. It needs the App Manager role."
echo "  Skip this section by pressing Enter on the first prompt if you are not ready."

KEY_ID=$(ask "  Key ID (or Enter to skip)")
if [ -n "$KEY_ID" ]; then
  ISSUER_ID=$(ask "  Issuer ID")
  KEY_PATH=$(ask "  Path to the .p8 file")
  if [ ! -f "$KEY_PATH" ]; then
    echo "  Cannot read $KEY_PATH" >&2
    exit 1
  fi
  TEAM_ID=$(ask "  Apple Team ID (from Membership)")

  gh secret set APP_STORE_CONNECT_KEY_ID --body "$KEY_ID"
  gh secret set APP_STORE_CONNECT_ISSUER_ID --body "$ISSUER_ID"
  gh secret set APP_STORE_CONNECT_KEY_CONTENT --body "$(cat "$KEY_PATH")"
  gh variable set APPLE_TEAM_ID --body "$TEAM_ID"
  echo "  ✓ App Store credentials saved"
else
  echo "  skipped"
fi

bold "Google Play"
echo "  Create the service account at play.google.com/console → Setup → API"
echo "  access, give it the Release manager role, and download the JSON key."

SA_PATH=$(ask "  Path to the service-account JSON (or Enter to skip)")
if [ -n "$SA_PATH" ]; then
  if [ ! -f "$SA_PATH" ]; then
    echo "  Cannot read $SA_PATH" >&2
    exit 1
  fi
  gh secret set PLAY_SERVICE_ACCOUNT_JSON --body "$(cat "$SA_PATH")"
  echo "  ✓ Play service account saved"
else
  echo "  skipped"
fi

if [ ! -f "$HOME/.nella-keys/nella-upload.p12" ]; then
  echo
  echo "  Warning: ~/.nella-keys/nella-upload.p12 is missing, so the Android"
  echo "  upload key secrets may be stale. See docs/store-release.md §2."
fi

bold "Secrets now on $REPO"
gh secret list

bold "Next"
cat <<'NEXT'
  1. Fill in store.config.json — siteUrl and supportEmail — and commit it.
  2. gh workflow run store.yml -f platform=both -f mode=build
  3. Once that is green: gh workflow run store.yml -f platform=both -f mode=release
NEXT
