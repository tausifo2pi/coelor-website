#!/bin/bash

# Reads .env and pushes every variable as a GitHub Actions secret.
# Usage: ./scripts/push-secrets.sh [path/to/.env]

set -euo pipefail

ENV_FILE="${1:-.env}"
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")

if [ -z "$REPO" ]; then
    echo "Error: not inside a GitHub repo or no remote set."
    echo "Run: git remote add origin https://github.com/your-user/your-repo.git"
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found."
    exit 1
fi

echo "Pushing secrets from $ENV_FILE to $REPO ..."

while IFS= read -r line || [ -n "$line" ]; do
    # Skip comments and empty lines
    [[ "$line" =~ ^#.*$ || -z "$line" ]] && continue

    KEY="${line%%=*}"
    VALUE="${line#*=}"
    # Strip surrounding quotes from value
    VALUE="${VALUE%\"}"
    VALUE="${VALUE#\"}"

    # Skip empty values
    if [ -z "$VALUE" ]; then
        echo "  - $KEY (skipped, empty)"
        continue
    fi

    gh secret set "$KEY" --body "$VALUE" --repo "$REPO"
    echo "  ✓ $KEY"
done < "$ENV_FILE"

# Also push the entire file as APP_ENV (used by CI to write .env in one step)
if [ "$ENV_FILE" = ".env" ]; then
    gh secret set APP_ENV --body "$(cat $ENV_FILE)" --repo "$REPO"
    echo "  ✓ APP_ENV (entire .env file)"
fi

echo ""
echo "Done. All secrets from $ENV_FILE are now set on $REPO"
