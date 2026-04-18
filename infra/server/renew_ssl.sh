#!/bin/bash

set -euo pipefail

LOGFILE=~/data/certbot/ssl-renewal.log
mkdir -p ~/data/certbot

log() {
  echo "$(date +"%Y-%m-%d %T") - $1" | tee -a $LOGFILE
}

log "Starting SSL renewal"

# Renew using existing certbot config — no new nginx needed
docker run --rm \
  -v ~/data/certbot/conf:/etc/letsencrypt \
  -v ~/data/certbot/www:/var/www/certbot \
  certbot/certbot renew --non-interactive --quiet | tee -a $LOGFILE

# Reload nginx to pick up new cert without downtime
docker-compose -f /home/ec2-user/server/docker-compose.yml restart nginx

log "SSL renewal completed"
