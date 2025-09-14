#!/bin/bash

# ISL Videos Environment Setup Script
# This script sets up the directory structure and permissions for ISL video storage
# Option 1: Using /var/www/signsphere/uploads/ directory

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_DIR="/var/www/signsphere/uploads"
ISL_VIDEOS_DIR="$BASE_DIR/isl-videos"
MALE_MODEL_DIR="$ISL_VIDEOS_DIR/male-model"
FEMALE_MODEL_DIR="$ISL_VIDEOS_DIR/female-model"

# Note: Category folders are not created automatically
# Users can organize videos as needed within male-model and female-model directories

echo -e "${BLUE}🚀 Setting up ISL Videos Environment...${NC}"
echo "=================================================="

# Function to print status messages
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    print_error "This script should not be run as root. Please run as a normal user."
    exit 1
fi

# Get current user
CURRENT_USER=$(whoami)
print_info "Running as user: $CURRENT_USER"

# Check if user has sudo privileges
if ! sudo -n true 2>/dev/null; then
    print_warning "This script requires sudo privileges. You may be prompted for your password."
fi

echo ""
print_info "Creating directory structure..."

# Create base directory structure
sudo mkdir -p "$BASE_DIR"
print_status "Created base directory: $BASE_DIR"

# Create ISL videos directory
sudo mkdir -p "$ISL_VIDEOS_DIR"
print_status "Created ISL videos directory: $ISL_VIDEOS_DIR"

# Create model directories
sudo mkdir -p "$MALE_MODEL_DIR"
sudo mkdir -p "$FEMALE_MODEL_DIR"
print_status "Created model directories"

# Note: Category subdirectories are not created automatically
# Users can organize videos as needed within the model directories

echo ""
print_info "Setting up permissions..."

# Set ownership to current user
sudo chown -R "$CURRENT_USER:$CURRENT_USER" "$BASE_DIR"
print_status "Set ownership to user: $CURRENT_USER"

# Set permissions (755 = owner: rwx, group: rx, others: rx)
sudo chmod -R 755 "$BASE_DIR"
print_status "Set permissions to 755"

echo ""
print_info "Creating sample files for testing..."

# Create sample README files
cat > /tmp/README.md << EOF
# ISL Videos Directory

This directory contains Indian Sign Language (ISL) videos for the SignSphere application.

## Directory Structure

\`\`\`
$ISL_VIDEOS_DIR/
├── male-model/
│   └── (videos organized as needed)
└── female-model/
    └── (videos organized as needed)
\`\`\`

## File Naming Convention

- Use descriptive names: \`train-arriving-platform-1.mp4\`
- Include category in filename: \`boarding-instructions.mp4\`
- Use lowercase with hyphens: \`platform-change-notice.mp4\`

## Supported Formats

- MP4 (recommended)
- WebM
- OGG

## File Size Limit

- Maximum file size: 50MB per video
- Recommended resolution: 720p or 1080p
- Recommended duration: 5-30 seconds per video

## Usage

Videos will be served at: \`https://your-domain.com/isl-videos/\`
EOF

sudo cp /tmp/README.md "$ISL_VIDEOS_DIR/"
sudo chown "$CURRENT_USER:$CURRENT_USER" "$ISL_VIDEOS_DIR/README.md"
rm /tmp/README.md
print_status "Created README.md file"

echo ""
print_info "Verifying setup..."

# Verify directory structure
if [ -d "$ISL_VIDEOS_DIR" ]; then
    print_status "ISL videos directory exists"
else
    print_error "ISL videos directory not found"
    exit 1
fi

# Verify permissions
if [ -w "$ISL_VIDEOS_DIR" ]; then
    print_status "Write permissions verified"
else
    print_error "Write permissions not set correctly"
    exit 1
fi

# Test file creation
TEST_FILE="$ISL_VIDEOS_DIR/test-write-permissions.txt"
if touch "$TEST_FILE" 2>/dev/null; then
    rm "$TEST_FILE"
    print_status "File creation test passed"
else
    print_error "File creation test failed"
    exit 1
fi

echo ""
print_info "Directory structure created:"
tree "$ISL_VIDEOS_DIR" 2>/dev/null || ls -la "$ISL_VIDEOS_DIR"

echo ""
print_info "Next steps:"
echo "1. Update your FastAPI backend configuration to use: $ISL_VIDEOS_DIR"
echo "2. Configure nginx to serve videos from: $ISL_VIDEOS_DIR"
echo "3. Update your frontend to upload videos to the correct endpoints"
echo "4. Test video upload functionality"

echo ""
print_info "Nginx configuration example:"
echo "location /isl-videos/ {"
echo "    alias $ISL_VIDEOS_DIR/;"
echo "    expires 1y;"
echo "    add_header Cache-Control \"public, immutable\";"
echo "}"

echo ""
print_status "ISL Videos environment setup completed successfully!"
echo "==================================================" 