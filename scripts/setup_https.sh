#!/bin/bash

# Script to set up HTTPS configuration for SignSphere
# This script updates the frontend and backend configurations for HTTPS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if IPv4 address is provided
if [ $# -eq 0 ]; then
    print_error "IPv4 address is required as an argument"
    echo "Usage: $0 <IPv4_ADDRESS>"
    echo "Example: $0 192.168.1.100"
    exit 1
fi

IPV4_ADDRESS=$1
# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get the parent directory (project root)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CERT_DIR="$PROJECT_ROOT/certificates"

# Validate IPv4 address format
if ! [[ $IPV4_ADDRESS =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
    print_error "Invalid IPv4 address format: $IPV4_ADDRESS"
    exit 1
fi

# Check if certificates exist
if [ ! -f "$CERT_DIR/signsphere.crt" ] || [ ! -f "$CERT_DIR/signsphere.key" ]; then
    print_error "Certificates not found. Please run generate_certificates.sh first"
    exit 1
fi

print_status "Setting up HTTPS configuration for IPv4: $IPV4_ADDRESS"

# Update backend configuration for HTTPS
print_status "Updating backend configuration..."

# Create HTTPS configuration for backend
cat > "$PROJECT_ROOT/backend/https_config.py" << EOF
import uvicorn
import os
from app.main import app

if __name__ == "__main__":
    # Get the project root directory dynamically
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cert_dir = os.path.join(project_root, "certificates")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=5001,
        reload=True,
        log_level="info",
        ssl_keyfile=os.path.join(cert_dir, "signsphere.key"),
        ssl_certfile=os.path.join(cert_dir, "signsphere.crt")
    )
EOF

# Update frontend environment for HTTPS
print_status "Updating frontend environment configuration..."

# Create HTTPS environment file
cat > "$PROJECT_ROOT/frontend/.env.local" << EOF
# HTTPS Configuration
NEXT_PUBLIC_API_URL=https://$IPV4_ADDRESS:5001
NODE_ENV=development
EOF

# Update Next.js configuration for HTTPS
print_status "Updating Next.js configuration for HTTPS..."

# Backup original next.config.js
if [ -f "$PROJECT_ROOT/frontend/next.config.js" ]; then
    cp "$PROJECT_ROOT/frontend/next.config.js" "$PROJECT_ROOT/frontend/next.config.js.backup"
fi

# Create HTTPS-enabled Next.js config
cat > "$PROJECT_ROOT/frontend/next.config.js" << EOF
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', '$IPV4_ADDRESS'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://$IPV4_ADDRESS:5001',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: \`\${process.env.NEXT_PUBLIC_API_URL || 'https://$IPV4_ADDRESS:5001'}/api/:path*\`,
      },
    ]
  },
  // HTTPS configuration for development
  ...(process.env.NODE_ENV === 'development' && {
    devServer: {
      https: {
        key: '$PROJECT_ROOT/certificates/signsphere.key',
        cert: '$PROJECT_ROOT/certificates/signsphere.crt',
      },
    },
  }),
}

module.exports = nextConfig
EOF

# Note: Individual startup scripts are no longer created
# Use the main start_services.sh script in the project root instead
print_status "HTTPS configuration files created successfully"

print_success "HTTPS configuration completed!"
echo ""
echo -e "${GREEN}Configuration Summary:${NC}"
echo "  - Backend HTTPS config: \$PROJECT_ROOT/backend/https_config.py"
echo "  - Frontend environment: \$PROJECT_ROOT/frontend/.env.local"
echo "  - Next.js config: \$PROJECT_ROOT/frontend/next.config.js"
echo ""
echo -e "${BLUE}Service Management:${NC}"
echo "  - Start services: \$PROJECT_ROOT/start_services.sh"
echo "  - Stop services: Press Ctrl+C while start_services.sh is running"
echo ""
echo -e "${YELLOW}Access URLs:${NC}"
echo "  - Frontend: https://$IPV4_ADDRESS:3000"
echo "  - Backend API: https://$IPV4_ADDRESS:5001"
echo "  - API Docs: https://$IPV4_ADDRESS:5001/docs"
echo ""
print_warning "Browser Security Notice:"
echo "  - Browsers will show security warnings for self-signed certificates"
echo "  - Click 'Advanced' and 'Proceed to site' to continue"
echo "  - This is normal behavior for self-signed certificates"