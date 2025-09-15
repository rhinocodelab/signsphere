#!/bin/bash

# Script to start SignSphere frontend and backend services
# This script stops any running instances and starts fresh services

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

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Set GCP credentials path dynamically
export GOOGLE_APPLICATION_CREDENTIALS="$PROJECT_ROOT/frontend/config/isl.json"

print_status "SignSphere Service Manager"
print_status "Project Root: $PROJECT_ROOT"
print_status "GCP Credentials: $GOOGLE_APPLICATION_CREDENTIALS"

# Verify GCP credentials file exists
if [ ! -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    print_error "GCP service account file not found at: $GOOGLE_APPLICATION_CREDENTIALS"
    print_status "Please ensure the service account JSON file exists in the frontend/config/ directory"
    exit 1
fi

print_success "GCP service account file found"
echo ""

# Function to stop processes by port
stop_process_by_port() {
    local port=$1
    local service_name=$2
    
    print_status "Checking for $service_name on port $port..."
    
    # Find processes using the port
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    
    if [ -n "$pids" ]; then
        print_warning "Found $service_name processes on port $port (PIDs: $pids)"
        print_status "Stopping $service_name processes..."
        
        # Kill processes gracefully first
        echo "$pids" | xargs kill -TERM 2>/dev/null || true
        
        # Wait a moment for graceful shutdown
        sleep 2
        
        # Force kill if still running
        local remaining_pids=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$remaining_pids" ]; then
            print_warning "Force killing remaining $service_name processes..."
            echo "$remaining_pids" | xargs kill -KILL 2>/dev/null || true
        fi
        
        print_success "$service_name processes stopped"
    else
        print_status "No $service_name processes found on port $port"
    fi
}

# Function to stop processes by name pattern
stop_process_by_name() {
    local process_pattern=$1
    local service_name=$2
    
    print_status "Checking for $service_name processes..."
    
    # Find processes matching the pattern
    local pids=$(pgrep -f "$process_pattern" 2>/dev/null || true)
    
    if [ -n "$pids" ]; then
        print_warning "Found $service_name processes (PIDs: $pids)"
        print_status "Stopping $service_name processes..."
        
        # Kill processes gracefully first
        echo "$pids" | xargs kill -TERM 2>/dev/null || true
        
        # Wait a moment for graceful shutdown
        sleep 2
        
        # Force kill if still running
        local remaining_pids=$(pgrep -f "$process_pattern" 2>/dev/null || true)
        if [ -n "$remaining_pids" ]; then
            print_warning "Force killing remaining $service_name processes..."
            echo "$remaining_pids" | xargs kill -KILL 2>/dev/null || true
        fi
        
        print_success "$service_name processes stopped"
    else
        print_status "No $service_name processes found"
    fi
}

# Stop existing services
print_status "=== Stopping Existing Services ==="

# Stop backend services (port 5001)
stop_process_by_port 5001 "Backend"

# Stop frontend services (port 3000)
stop_process_by_port 3000 "Frontend"

# Stop any Python processes running our backend
stop_process_by_name "python.*https_config.py" "Backend (Python)"

# Stop any Node.js processes running our frontend
stop_process_by_name "node.*next" "Frontend (Node.js)"

echo ""

# Check if HTTPS setup is required
print_status "=== Checking HTTPS Configuration ==="

CERT_DIR="$PROJECT_ROOT/certificates"
HTTPS_CONFIG="$BACKEND_DIR/https_config.py"

if [ ! -f "$CERT_DIR/signsphere.crt" ] || [ ! -f "$CERT_DIR/signsphere.key" ]; then
    print_error "HTTPS certificates not found!"
    print_status "Please run the following commands first:"
    echo "  cd scripts"
    echo "  ./generate_certificates.sh <YOUR_IP_ADDRESS>"
    echo "  ./setup_https.sh <YOUR_IP_ADDRESS>"
    exit 1
fi

if [ ! -f "$HTTPS_CONFIG" ]; then
    print_error "HTTPS configuration not found!"
    print_status "Please run the following command first:"
    echo "  cd scripts"
    echo "  ./setup_https.sh <YOUR_IP_ADDRESS>"
    exit 1
fi

print_success "HTTPS configuration found"

# Check if virtual environment exists and create if needed
if [ ! -d "$BACKEND_DIR/venv" ]; then
    print_warning "Backend virtual environment not found!"
    print_status "Creating virtual environment..."
    cd "$BACKEND_DIR"
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        print_error "Failed to create virtual environment!"
        exit 1
    fi
    print_success "Virtual environment created"
    
    print_status "Installing Python dependencies..."
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        print_error "Failed to install Python dependencies!"
        exit 1
    fi
    print_success "Python dependencies installed"
else
    print_success "Backend virtual environment found"
    
    # Check if requirements are installed
    cd "$BACKEND_DIR"
    source venv/bin/activate
    if ! python -c "import fastapi, sqlalchemy, passlib" 2>/dev/null; then
        print_warning "Some Python dependencies appear to be missing!"
        print_status "Installing/updating Python dependencies..."
        pip install --upgrade pip
        pip install -r requirements.txt
        if [ $? -ne 0 ]; then
            print_error "Failed to install Python dependencies!"
            exit 1
        fi
        print_success "Python dependencies installed/updated"
    else
        print_success "Python dependencies verified"
    fi
fi

# Check if frontend dependencies are installed and install if needed
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    print_warning "Frontend dependencies not installed!"
    print_status "Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install frontend dependencies!"
        exit 1
    fi
    print_success "Frontend dependencies installed"
else
    print_success "Frontend dependencies found"
fi

# Initialize database if needed
print_status "=== Checking Database ==="
cd "$BACKEND_DIR"
source venv/bin/activate

# Check if database exists and has tables
if ! python -c "from app.db.session import engine; from sqlalchemy import inspect; inspector = inspect(engine); tables = inspector.get_table_names(); exit(0 if 'users' in tables else 1)" 2>/dev/null; then
    print_warning "Database not initialized or missing tables!"
    print_status "Initializing database..."
    python -m app.db.init_db
    if [ $? -ne 0 ]; then
        print_error "Failed to initialize database!"
        exit 1
    fi
    print_success "Database initialized successfully"
else
    print_success "Database verified"
fi

echo ""

# Start services
print_status "=== Starting Services ==="

# Start backend
print_status "Starting Backend (HTTPS on port 5001)..."
cd "$BACKEND_DIR"
source venv/bin/activate

# Verify GCP credentials are accessible
print_status "Verifying GCP credentials..."
if python -c "import os; from google.cloud import speech; print('GCP credentials verified successfully')" 2>/dev/null; then
    print_success "GCP Speech-to-Text API credentials verified"
else
    print_warning "GCP credentials verification failed, but continuing..."
    print_status "Speech recognition features may not work properly"
fi

python https_config.py &
BACKEND_PID=$!
print_success "Backend started with PID: $BACKEND_PID"

# Wait a moment for backend to initialize
sleep 3

# Extract IP address from certificate for display purposes
CERT_IP=$(openssl x509 -in "$CERT_DIR/signsphere.crt" -text -noout | grep "IP Address:" | head -1 | sed 's/.*IP Address:\([0-9.]*\).*/\1/' | grep -v "127.0.0.1" | head -1)
if [ -z "$CERT_IP" ]; then
    # Fallback to localhost if no IP found
    CERT_IP="localhost"
fi

# Build and start frontend (bind to 0.0.0.0 to accept connections from any IP)
print_status "Building Frontend..."
cd "$FRONTEND_DIR"
npm run build
if [ $? -ne 0 ]; then
    print_error "Frontend build failed!"
    exit 1
fi
print_success "Frontend build completed successfully"

print_status "Starting Frontend (HTTPS on port 3000)..."
NODE_TLS_REJECT_UNAUTHORIZED=0 npm run dev -- --experimental-https --experimental-https-key "$PROJECT_ROOT/certificates/signsphere.key" --experimental-https-cert "$PROJECT_ROOT/certificates/signsphere.crt" --hostname 0.0.0.0 &
FRONTEND_PID=$!
print_success "Frontend started with PID: $FRONTEND_PID"

echo ""
print_success "=== Services Started Successfully ==="
echo ""
print_status "Service Information:"
echo "  Backend PID: $BACKEND_PID"
echo "  Frontend PID: $FRONTEND_PID"
echo ""
print_status "Access URLs:"
echo "  Frontend: https://$CERT_IP:3000"
echo "  Frontend (localhost): https://localhost:3000"
echo "  Backend API: https://$CERT_IP:5001"
echo "  Backend API (localhost): https://localhost:5001"
echo "  API Documentation: https://$CERT_IP:5001/docs"
echo ""
print_warning "Browser Security Notice:"
echo "  - Browsers will show security warnings for self-signed certificates"
echo "  - Click 'Advanced' and 'Proceed to site' to continue"
echo ""
print_status "To stop services:"
echo "  - Press Ctrl+C to gracefully stop all services"
echo "  - Or kill processes manually: kill $BACKEND_PID $FRONTEND_PID"

# Function to handle script termination
cleanup() {
    echo ""
    print_status "Stopping services..."
    
    # Stop backend
    if kill -0 $BACKEND_PID 2>/dev/null; then
        print_status "Stopping backend (PID: $BACKEND_PID)..."
        kill -TERM $BACKEND_PID 2>/dev/null || true
        sleep 2
        kill -KILL $BACKEND_PID 2>/dev/null || true
        print_success "Backend stopped"
    fi
    
    # Stop frontend
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        print_status "Stopping frontend (PID: $FRONTEND_PID)..."
        kill -TERM $FRONTEND_PID 2>/dev/null || true
        sleep 2
        kill -KILL $FRONTEND_PID 2>/dev/null || true
        print_success "Frontend stopped"
    fi
    
    print_success "All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for processes
print_status "Services are running... Press Ctrl+C to stop"
wait
