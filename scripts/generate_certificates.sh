#!/bin/bash

# Script to generate self-signed certificates for SignSphere frontend and backend
# Usage: ./generate_certificates.sh <IPv4_ADDRESS>
# Example: ./generate_certificates.sh 192.168.1.100

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Validate IPv4 address format
if ! [[ $IPV4_ADDRESS =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
    print_error "Invalid IPv4 address format: $IPV4_ADDRESS"
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get the parent directory (project root)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
# Create certificates directory
CERT_DIR="$PROJECT_ROOT/certificates"
mkdir -p "$CERT_DIR"

print_status "Generating self-signed certificates for IPv4: $IPV4_ADDRESS"

# Generate private key
print_status "Generating private key..."
openssl genrsa -out "$CERT_DIR/signsphere.key" 2048

# Generate certificate signing request (CSR)
print_status "Generating certificate signing request..."
openssl req -new -key "$CERT_DIR/signsphere.key" -out "$CERT_DIR/signsphere.csr" -subj "/C=US/ST=State/L=City/O=SignSphere/OU=IT Department/CN=$IPV4_ADDRESS"

# Generate self-signed certificate
print_status "Generating self-signed certificate..."
openssl x509 -req -days 365 -in "$CERT_DIR/signsphere.csr" -signkey "$CERT_DIR/signsphere.key" -out "$CERT_DIR/signsphere.crt" -extensions v3_req -extfile <(
cat <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C=US
ST=State
L=City
O=SignSphere
OU=IT Department
CN=$IPV4_ADDRESS

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @alt_names

[alt_names]
IP.1 = $IPV4_ADDRESS
IP.2 = 127.0.0.1
DNS.1 = localhost
DNS.2 = *.localhost
DNS.3 = $IPV4_ADDRESS
EOF
)

# Generate PEM format (combining cert and key)
print_status "Generating PEM format..."
cat "$CERT_DIR/signsphere.crt" "$CERT_DIR/signsphere.key" > "$CERT_DIR/signsphere.pem"

# Set proper permissions
chmod 600 "$CERT_DIR/signsphere.key"
chmod 644 "$CERT_DIR/signsphere.crt"
chmod 644 "$CERT_DIR/signsphere.pem"
chmod 644 "$CERT_DIR/signsphere.csr"

# Clean up CSR file (not needed for runtime)
rm "$CERT_DIR/signsphere.csr"

print_success "Certificates generated successfully!"
print_status "Certificate files created in: $CERT_DIR"
echo ""
echo -e "${GREEN}Files generated:${NC}"
echo "  - signsphere.key  (Private key)"
echo "  - signsphere.crt  (Certificate)"
echo "  - signsphere.pem  (Combined cert + key)"
echo ""
echo -e "${YELLOW}Certificate details:${NC}"
openssl x509 -in "$CERT_DIR/signsphere.crt" -text -noout | grep -E "(Subject:|DNS:|IP Address:|Not Before|Not After)"

echo ""
print_warning "Security Notice:"
echo "  - These are self-signed certificates for development/testing only"
echo "  - Browsers will show security warnings - this is normal for self-signed certs"
echo "  - For production, use certificates from a trusted Certificate Authority"
echo ""
print_status "Next steps:"
echo "  1. Configure your frontend to use HTTPS with these certificates"
echo "  2. Configure your backend to use HTTPS with these certificates"
echo "  3. Update your application configurations to use HTTPS URLs"
echo ""
echo -e "${BLUE}Certificate paths for configuration:${NC}"
echo "  Private Key: $CERT_DIR/signsphere.key"
echo "  Certificate: $CERT_DIR/signsphere.crt"
echo "  Combined:    $CERT_DIR/signsphere.pem"
