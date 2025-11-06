#!/bin/bash

# CarCommun Development Setup Script
# This script sets up the complete development environment

set -e  # Exit on any error

echo "🚗 CarCommun Development Setup"
echo "==============================="

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

# Check if running on the correct operating system
check_os() {
    print_status "Checking operating system..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
    else
        print_warning "Unknown OS: $OSTYPE"
        OS="unknown"
    fi
    
    print_success "Detected OS: $OS"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check .NET
    if ! command -v dotnet &> /dev/null; then
        missing_tools+=("dotnet")
    else
        dotnet_version=$(dotnet --version)
        print_success "✓ .NET $dotnet_version found"
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        missing_tools+=("node")
    else
        node_version=$(node --version)
        print_success "✓ Node.js $node_version found"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        missing_tools+=("npm")
    else
        npm_version=$(npm --version)
        print_success "✓ npm $npm_version found"
    fi
    
    # Check Flutter
    if ! command -v flutter &> /dev/null; then
        missing_tools+=("flutter")
    else
        flutter_version=$(flutter --version | head -n 1)
        print_success "✓ $flutter_version found"
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        missing_tools+=("docker")
    else
        docker_version=$(docker --version)
        print_success "✓ $docker_version found"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        missing_tools+=("docker-compose")
    else
        compose_version=$(docker-compose --version)
        print_success "✓ $compose_version found"
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        missing_tools+=("git")
    else
        git_version=$(git --version)
        print_success "✓ $git_version found"
    fi
    
    # Report missing tools
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools:"
        for tool in "${missing_tools[@]}"; do
            echo "  - $tool"
        done
        echo ""
        echo "Please install the missing tools and run this script again."
        echo "Visit the development setup guide for installation instructions."
        exit 1
    fi
}

# Setup Docker environment
setup_docker() {
    print_status "Setting up Docker environment..."
    
    # Create .env file for development
    cat > .env << EOF
# Database Configuration
POSTGRES_USER=caruser
POSTGRES_PASSWORD=carpass123
POSTGRES_DB=carmaintenance

# Redis Configuration
REDIS_PASSWORD=redis123

# JWT Configuration
JWT_SECRET_KEY=your-development-jwt-secret-key-change-in-production

# API Configuration
API_PORT=5000
FRONTEND_PORT=4200
PGADMIN_PORT=8080
MAILHOG_PORT=8025

# Development Flags
DEBUG_MODE=true
LOG_LEVEL=Information
EOF
    
    print_success "Created .env file for development"
    
    # Create SQL init directory
    mkdir -p sql/init
    
    # Create database initialization script
    cat > sql/init/01-create-extensions.sql << EOF
-- Enable useful PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create database user
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'caruser') THEN
        CREATE USER caruser WITH PASSWORD 'carpass123';
    END IF;
END
\$\$;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE carmaintenance TO caruser;
GRANT ALL PRIVILEGES ON SCHEMA public TO caruser;
EOF
    
    print_success "Created database initialization scripts"
    
    # Start Docker services
    print_status "Starting Docker services..."
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check service health
    if docker-compose ps | grep -q "Up"; then
        print_success "Docker services are running"
    else
        print_error "Some Docker services failed to start"
        docker-compose logs
        exit 1
    fi
}

# Setup .NET backend
setup_backend() {
    print_status "Setting up .NET backend..."
    
    cd src/CarMaintenance.Api
    
    # Restore packages
    print_status "Restoring NuGet packages..."
    dotnet restore
    
    # Apply database migrations
    print_status "Applying database migrations..."
    dotnet ef database update
    
    cd ../..
    
    print_success "Backend setup completed"
}

# Setup Angular frontend
setup_frontend() {
    print_status "Setting up Angular frontend..."
    
    cd ClientApp
    
    # Install dependencies
    print_status "Installing npm dependencies..."
    npm install
    
    # Create environment file if it doesn't exist
    if [ ! -f "src/environments/environment.ts" ]; then
        cat > src/environments/environment.ts << EOF
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000',
  signalRHubUrl: 'http://localhost:5000/hubs/chat',
  enableLogging: true,
  enableDevTools: true
};
EOF
        print_success "Created environment.ts file"
    fi
    
    cd ..
    
    print_success "Frontend setup completed"
}

# Setup Flutter mobile
setup_mobile() {
    print_status "Setting up Flutter mobile..."
    
    cd mobile
    
    # Get dependencies
    print_status "Getting Flutter dependencies..."
    flutter pub get
    
    # Create environment file if it doesn't exist
    if [ ! -f "lib/core/config/environment.dart" ]; then
        mkdir -p lib/core/config
        cat > lib/core/config/environment.dart << EOF
class Environment {
  static const String baseUrl = 'http://localhost:5000';
  static const bool enableLogging = true;
  static const String environment = 'development';
}
EOF
        print_success "Created environment.dart file"
    fi
    
    # Run Flutter doctor
    print_status "Running Flutter doctor..."
    flutter doctor
    
    cd ..
    
    print_success "Mobile setup completed"
}

# Create development scripts
create_scripts() {
    print_status "Creating development scripts..."
    
    # Create scripts directory
    mkdir -p scripts
    
    # Create run-development script
    cat > scripts/run-development.sh << 'EOF'
#!/bin/bash
# Run all development services

echo "Starting CarCommun development environment..."

# Start Docker services
docker-compose up -d

# Wait a moment for services to start
sleep 5

# Start backend API
echo "Starting .NET API..."
cd src/CarMaintenance.Api
dotnet watch run &
API_PID=$!
cd ../..

# Start frontend (in new terminal if possible)
echo "Starting Angular frontend..."
cd ClientApp
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- npm start
elif command -v osascript &> /dev/null; then
    osascript -e 'tell application "Terminal" to do script "cd '$(pwd)' && npm start"'
else
    npm start &
fi
cd ..

echo "Development environment started!"
echo "API: http://localhost:5000"
echo "Frontend: http://localhost:4200"
echo "Database: localhost:5432"
echo "Press Ctrl+C to stop all services"
EOF
    
    chmod +x scripts/run-development.sh
    
    # Create stop-development script
    cat > scripts/stop-development.sh << 'EOF'
#!/bin/bash
# Stop all development services

echo "Stopping CarCommun development environment..."

# Stop Docker services
docker-compose down

# Kill .NET processes
pkill -f "dotnet watch"

# Kill Node.js processes
pkill -f "npm start"

echo "All services stopped."
EOF
    
    chmod +x scripts/stop-development.sh
    
    print_success "Created development scripts"
}

# Setup IDE configuration
setup_ide() {
    print_status "Setting up IDE configuration..."
    
    # Create VS Code workspace settings
    mkdir -p .vscode
    
    cat > .vscode/settings.json << EOF
{
  "omnisharp.enableRoslynAnalyzers": true,
  "omnisharp.enableImportCompletion": true,
  "omnisharp.enableDecompilationSupport": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "angular.enable-strict-mode-prompt": false,
  "files.exclude": {
    "**/bin": true,
    "**/obj": true,
    "**/dist": true,
    "**/.angular": true,
    "**/build": true
  },
  "docker.defaultRegistryPath": "ghcr.io",
  "docker.languageserver.trace.server": "verbose"
}
EOF
    
    # Create VS Code extensions recommendation
    cat > .vscode/extensions.json << EOF
{
  "recommendations": [
    "ms-dotnettools.csharp",
    "ms-vscode.vscode-typescript-next",
    "angular.ng-template",
    "dart-code.dart-code",
    "dart-code.flutter",
    "ms-azuretools.vscode-docker",
    "redhat.vscode-yaml",
    "eamodio.gitlens",
    "ms-vscode.vscode-eslint",
    "esbenp.prettier-vscode"
  ]
}
EOF
    
    print_success "Created VS Code configuration"
}

# Main execution
main() {
    echo "Starting setup process..."
    echo ""
    
    check_os
    check_prerequisites
    setup_docker
    setup_backend
    setup_frontend
    setup_mobile
    create_scripts
    setup_ide
    
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Run './scripts/run-development.sh' to start all services"
    echo "2. Open http://localhost:4200 for the frontend"
    echo "3. Open http://localhost:5000/swagger for API documentation"
    echo "4. Open http://localhost:8080 for pgAdmin (admin@carmaintenance.local / admin123)"
    echo ""
    echo "For more information, see docs/development-setup.md"
}

# Run main function
main "$@"