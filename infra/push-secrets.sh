#!/bin/bash

# Pushes env files to GitHub Actions secrets.
#
#   App runtime env (.env)  -> ONE secret, WEBSITE_ENV, holding the whole file.
#                              The deploy job writes it to /home/ec2-user/server/website.env
#                              on EC2; it is never baked into the Docker image.
#   CI env (.env.ci)        -> one secret per variable (the workflow reads them individually).
#
# Usage: ./push-secrets.sh [path/to/.env | path/to/.env.ci]

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

# App runtime env: push the whole file as a single secret (stdin, so it never hits the process list).
if [ "$(basename "$ENV_FILE")" = ".env" ]; then
    if ! grep -qE '^[A-Za-z_][A-Za-z0-9_]*=.+' "$ENV_FILE"; then
        echo "Error: $ENV_FILE has no non-empty variables; refusing to push an empty WEBSITE_ENV."
        exit 1
    fi
    gh secret set WEBSITE_ENV --repo "$REPO" < "$ENV_FILE"
    echo "  ✓ WEBSITE_ENV (entire $ENV_FILE: $(grep -cE '^[A-Za-z_][A-Za-z0-9_]*=' "$ENV_FILE") variables)"
    echo ""
    echo "Done. The next deploy writes it to website.env on EC2."
    exit 0
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

echo ""
echo "Done. All secrets from $ENV_FILE are now set on $REPO"
