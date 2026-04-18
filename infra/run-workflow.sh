#!/bin/bash

# Trigger GitHub Actions workflows from terminal
# Usage: ./infra/run-workflow.sh [step]
# Steps: transfer | setup | ssl | deploy | all

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")

if [ -z "$REPO" ]; then
    echo "Error: no GitHub remote found."
    exit 1
fi

run() {
    echo "Running: $1"
    gh workflow run ci.yml --repo "$REPO" \
        -f transfer_file="${2:-false}" \
        -f update_ec2="${3:-false}" \
        -f generate_ssl="${4:-false}" \
        -f build="${5:-false}" \
        -f deploy="${6:-false}" \
        -f cleanup="${7:-false}"
    echo "Done. Watch: https://github.com/$REPO/actions"
}

case "${1:-}" in
    transfer) run "Transfer server files"  true  false false false false false ;;
    setup)    run "Install Docker on EC2"  false true  false false false false ;;
    ssl)      run "Generate SSL cert"      false false true  false false false ;;
    deploy)    run "Build & Deploy"         false false false true  true  true  ;;
    renew-ssl) run "Renew SSL cert"         false false true  false false false ;;
    all)
        echo "Running full one-time EC2 setup..."
        run "Transfer server files"  true  false false false false false
        sleep 10
        run "Install Docker on EC2"  false true  false false false false
        sleep 10
        run "Generate SSL cert"      false false true  false false false
        ;;
    *)
        echo "Usage: ./infra/run-workflow.sh [step]"
        echo ""
        echo "  transfer  — upload server config files to EC2"
        echo "  setup     — install Docker on EC2 (run once)"
        echo "  ssl       — generate SSL certificate (run once)"
        echo "  deploy     — build image and deploy to EC2"
        echo "  renew-ssl  — manually renew SSL cert"
        echo "  all        — run transfer + setup + ssl in sequence"
        ;;
esac
