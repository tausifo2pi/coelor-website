#!/bin/bash

set -euxo pipefail

echo "Updating EC2 instance..."

# Install Docker
echo "Installing Docker..."
sudo yum install -y docker

# Start Docker
echo "Starting Docker..."
sudo systemctl start docker

# Enable Docker to start on boot
echo "Enabling Docker..."
sudo systemctl enable docker

# Add current user to the Docker group
echo "Adding user to Docker group..."
sudo usermod -aG docker $(whoami)

# Remove old Docker Compose if it exists
echo "Removing old Docker Compose..."
sudo rm -f /usr/local/bin/docker-compose

# Get the latest version of Docker Compose
echo "Getting latest Docker Compose version..."
LATEST_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)

# Install Docker Compose
echo "Installing Docker Compose version $LATEST_VERSION..."
sudo curl -L "https://github.com/docker/compose/releases/download/${LATEST_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make Docker Compose executable
echo "Making Docker Compose executable..."
sudo chmod +x /usr/local/bin/docker-compose

# Verify Docker Compose installation
echo "Verifying Docker Compose installation..."
docker-compose --version

echo "EC2 update completed successfully."
