#!/bin/bash

# Configuration
DEFAULT_REPLICAS=3
LOAD_BALANCER_PORT=3000
LOAD_BALANCER_ADDRESS="127.0.0.1:${LOAD_BALANCER_PORT}"
BASE_BLOB_SERVER_PORT=3001
CACHE_SERVICE_PORT=4242

# Color codes for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
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

# Function to check if a port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1  # Port is in use
    else
        return 0  # Port is available
    fi
}

# Function to wait for load balancer to be ready
wait_for_load_balancer() {
    local max_attempts=30
    local attempt=1
    
    print_info "Waiting for load balancer to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://${LOAD_BALANCER_ADDRESS}/internal/nodes" >/dev/null 2>&1; then
            print_success "Load balancer is ready!"
            return 0
        fi
        
        print_info "Attempt $attempt/$max_attempts - Load balancer not ready yet..."
        sleep 2
        ((attempt++))
    done
    
    print_error "Load balancer failed to start within expected time"
    return 1
}

# Function to cleanup background processes on exit
cleanup() {
    print_warning "Shutting down services..."
    if [ ! -z "$LOAD_BALANCER_PID" ]; then
        kill $LOAD_BALANCER_PID 2>/dev/null
        print_info "Load balancer stopped"
    fi
    
    for pid in "${BLOB_SERVER_PIDS[@]}"; do
        if [ ! -z "$pid" ]; then
            kill $pid 2>/dev/null
        fi
    done
    
    if [ ${#BLOB_SERVER_PIDS[@]} -gt 0 ]; then
        print_info "All blob servers stopped"
    fi
    
    if [ ! -z "$CACHE_SERVICE_PID" ]; then
        kill $CACHE_SERVICE_PID 2>/dev/null
        print_info "Cache service stopped"
    fi
    
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Parse command line arguments
REPLICAS=${1:-$DEFAULT_REPLICAS}

# Validate input
if ! [[ "$REPLICAS" =~ ^[0-9]+$ ]] || [ "$REPLICAS" -lt 1 ]; then
    print_error "Invalid number of replicas. Please provide a positive integer."
    echo "Usage: $0 [number_of_replicas]"
    echo "Example: $0 3"
    exit 1
fi

print_info "Starting services with $REPLICAS blob server replicas"

# Check if pnpm is available
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed or not in PATH"
    exit 1
fi

# Check if load balancer port is available
if ! check_port $LOAD_BALANCER_PORT; then
    print_error "Port $LOAD_BALANCER_PORT is already in use. Please stop the service using this port."
    exit 1
fi

# Start load balancer
print_info "Starting load balancer on port $LOAD_BALANCER_PORT..."
NODE_OPTIONS="" LOAD_BALANCER_ADDRESS=$LOAD_BALANCER_ADDRESS pnpm run load-balancer:prod &
LOAD_BALANCER_PID=$!

# Wait for load balancer to be ready
if ! wait_for_load_balancer; then
    cleanup
    exit 1
fi

# Array to store blob server PIDs
BLOB_SERVER_PIDS=()

# Start blob server replicas
print_info "Starting $REPLICAS blob server replicas..."
for i in $(seq 1 $REPLICAS); do
    port=$((BASE_BLOB_SERVER_PORT + i - 1))
    node_name="blob-server-$i"
    
    # Check if port is available
    if ! check_port $port; then
        print_warning "Port $port is already in use, skipping replica $i"
        continue
    fi
    
    print_info "Starting blob server replica $i ($node_name) on port $port..."
    
    # Start blob server with environment variables
    NODE_OPTIONS="" PORT=$port NODE_NAME=$node_name LOAD_BALANCER_ADDRESS=$LOAD_BALANCER_ADDRESS pnpm run http-blob-server:prod &
    BLOB_SERVER_PIDS+=($!)
    
    # Small delay between starting servers
    sleep 1
done

# Check if cache service port is available
if ! check_port $CACHE_SERVICE_PORT; then
    print_error "Port $CACHE_SERVICE_PORT is already in use. Please stop the service using this port."
    cleanup
    exit 1
fi

# Start cache service last
print_info "Starting cache service on port $CACHE_SERVICE_PORT..."
NODE_OPTIONS="" PORT=$CACHE_SERVICE_PORT LOAD_BALANCER_ADDRESS=$LOAD_BALANCER_ADDRESS pnpm run cache-proxy:dev &
CACHE_SERVICE_PID=$!

print_success "All services started successfully!"
print_info "Load balancer running on: http://${LOAD_BALANCER_ADDRESS}"
print_info "Blob servers running on ports: $(seq -s', ' $BASE_BLOB_SERVER_PORT $((BASE_BLOB_SERVER_PORT + REPLICAS - 1)))"
print_info "Cache service running on: http://127.0.0.1:${CACHE_SERVICE_PORT}"
print_info ""
print_info "Press Ctrl+C to stop all services"

# Wait for all background processes
wait 