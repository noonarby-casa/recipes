#!/usr/bin/env bash
set -eo pipefail

# Determine if the script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
  IS_SOURCED=1
else
  IS_SOURCED=0
fi

exit_script() {
  local code="${1:-0}"
  if [[ "$IS_SOURCED" -eq 1 ]]; then
    return "$code" 2>/dev/null
  else
    exit "$code"
  fi
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

FORCE_YES=0
for arg in "$@"; do
  case "$arg" in
    -y|--yes)
      FORCE_YES=1
      ;;
  esac
done

# 1. Source NVM
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
elif command -v nvm >/dev/null 2>&1; then
  :
else
  echo "❌ Error: nvm is not found in \$NVM_DIR ($NVM_DIR) or PATH." >&2
  exit_script 1
fi

echo "🔍 Checking for toolchain updates..."

# --- 2. Check Node ---
CURRENT_NODE=$(node -v 2>/dev/null || echo "")
TARGET_NODE=$(nvm version-remote 2>/dev/null || echo "")

NODE_UPDATE_AVAILABLE=0
if [[ -n "$TARGET_NODE" && -n "$CURRENT_NODE" && "$CURRENT_NODE" != "$TARGET_NODE" ]]; then
  NODE_UPDATE_AVAILABLE=1
fi

# --- 3. Check pnpm ---
CURRENT_PNPM=$(pnpm -v 2>/dev/null || echo "")
TARGET_PNPM=""
if command -v pnpm >/dev/null 2>&1; then
  TARGET_PNPM=$(pnpm info pnpm version 2>/dev/null || echo "")
fi

PNPM_UPDATE_AVAILABLE=0
if [[ -n "$TARGET_PNPM" && -n "$CURRENT_PNPM" && "$CURRENT_PNPM" != "$TARGET_PNPM" ]]; then
  PNPM_UPDATE_AVAILABLE=1
fi

# --- 4. Check Hugo via apt ---
CURRENT_HUGO=$(dpkg -s hugo 2>/dev/null | grep '^Version:' | awk '{print $2}' || echo "")
CANDIDATE_HUGO=$(apt-cache policy hugo 2>/dev/null | grep 'Candidate:' | awk '{print $2}' || echo "")

HUGO_UPDATE_AVAILABLE=0
if [[ -n "$CANDIDATE_HUGO" && -n "$CURRENT_HUGO" && "$CANDIDATE_HUGO" != "(none)" && "$CURRENT_HUGO" != "$CANDIDATE_HUGO" ]]; then
  HUGO_UPDATE_AVAILABLE=1
fi

# --- 5. Display Update Summary ---
UPDATES_COUNT=$((NODE_UPDATE_AVAILABLE + PNPM_UPDATE_AVAILABLE + HUGO_UPDATE_AVAILABLE))

if [[ "$UPDATES_COUNT" -eq 0 ]]; then
  echo ""
  echo "✓ All toolchains are up to date!"
  echo "    Node: ${CURRENT_NODE:-not found}"
  echo "    pnpm: ${CURRENT_PNPM:-not found}"
  echo "    Hugo: ${CURRENT_HUGO:-not found} (system package)"
  echo ""
  # Ensure repository configs are synced
  node "$ROOT_DIR/scripts/check-toolchain.js" --quiet || node "$ROOT_DIR/scripts/sync-toolchain.js"
  exit_script 0
fi

echo ""
echo "🚀 Updates available for:"
if [[ "$NODE_UPDATE_AVAILABLE" -eq 1 ]]; then
  echo "    - node: $CURRENT_NODE -> $TARGET_NODE (via nvm)"
fi
if [[ "$PNPM_UPDATE_AVAILABLE" -eq 1 ]]; then
  echo "    - pnpm: $CURRENT_PNPM -> $TARGET_PNPM"
fi
if [[ "$HUGO_UPDATE_AVAILABLE" -eq 1 ]]; then
  echo "    - hugo: $CURRENT_HUGO -> $CANDIDATE_HUGO (via apt)"
fi
echo ""

# --- 6. Prompt User Confirmation ---
if [[ "$FORCE_YES" -eq 1 ]]; then
  echo "Proceeding with updates (-y flag provided)..."
else
  # Clear O_NONBLOCK on stdin / controlling tty if set by terminal multiplexer
  python3 -c "import fcntl, os; fcntl.fcntl(0, fcntl.F_SETFL, fcntl.fcntl(0, fcntl.F_GETFL) & ~os.O_NONBLOCK)" 2>/dev/null || true

  CONFIRM=""
  if [ -t 0 ] && [ -r /dev/tty ]; then
    read -rp "Do you want to proceed with these updates? [y/N] " CONFIRM < /dev/tty
  else
    read -rp "Do you want to proceed with these updates? [y/N] " CONFIRM
  fi

  case "$CONFIRM" in
    [yY][eE][sS]|[yY])
      echo ""
      ;;
    *)
      echo "Update cancelled."
      exit_script 0
      ;;
  esac
fi

# --- 7. Perform Updates ---
if [[ "$NODE_UPDATE_AVAILABLE" -eq 1 ]]; then
  echo "==> Upgrading Node.js to $TARGET_NODE..."
  nvm install "$TARGET_NODE" --reinstall-packages-from=current
  nvm alias default "$TARGET_NODE"
  nvm use "$TARGET_NODE"
fi

if [[ "$PNPM_UPDATE_AVAILABLE" -eq 1 ]]; then
  echo "==> Upgrading pnpm to $TARGET_PNPM..."
  if command -v npm >/dev/null 2>&1; then
    npm install -g "pnpm@$TARGET_PNPM"
  else
    pnpm add -g "pnpm@$TARGET_PNPM"
  fi
fi

if [[ "$HUGO_UPDATE_AVAILABLE" -eq 1 ]]; then
  echo "==> Upgrading Hugo via apt..."
  sudo apt-get install --only-upgrade -y hugo
fi

# --- 8. Sync Repo Configs and Verify Parity ---
echo ""
echo "==> Synchronizing repository configurations (.nvmrc, package.json, .hugo-version)..."
node "$ROOT_DIR/scripts/sync-toolchain.js"

echo ""
echo "==> Installing dependencies and verifying lockfile..."
pnpm install

echo ""
echo "==> Running project CI verification..."
pnpm run ci

echo ""
echo "🎉 Toolchain update and verification complete!"
if [[ "$IS_SOURCED" -eq 0 && "$NODE_UPDATE_AVAILABLE" -eq 1 ]]; then
  echo "💡 Tip: To switch to Node $TARGET_NODE in your current shell session, run:"
  echo "    nvm use"
fi
