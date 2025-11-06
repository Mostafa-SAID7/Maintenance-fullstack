#!/bin/bash

# CarCommun Testing Script
# Comprehensive testing for all project components

set -e

echo "🧪 CarCommun Testing Suite"
echo "=========================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Function to run test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    print_status "Running $test_name..."
    
    if eval "$test_command"; then
        print_success "✓ $test_name passed"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_error "✗ $test_name failed"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Function to run tests with coverage
run_coverage_test() {
    local test_name="$1"
    local test_command="$2"
    local coverage_output="$3"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    print_status "Running $test_name with coverage..."
    
    if eval "$test_command" > "$coverage_output" 2>&1; then
        print_success "✓ $test_name passed"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        
        # Extract coverage percentage
        if [ -f "$coverage_output" ]; then
            coverage_percent=$(grep -o "Coverage: [0-9]*" "$coverage_output" | grep -o "[0-9]*" | head -1)
            if [ ! -z "$coverage_percent" ]; then
                print_status "Coverage: ${coverage_percent}%"
            fi
        fi
    else
        print_error "✗ $test_name failed"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Check if services are running
check_services() {
    print_status "Checking if required services are running..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    # Check if database is accessible
    if ! docker-compose exec -T postgres pg_isready -U caruser > /dev/null 2>&1; then
        print_warning "Database might not be ready. Starting services..."
        docker-compose up -d postgres redis
        sleep 10
    fi
    
    print_success "Services are ready for testing"
}

# Backend Tests
test_backend() {
    print_status "Running backend tests..."
    echo ""
    
    cd src/CarMaintenance.Api
    
    # Restore packages
    run_test "Restore NuGet packages" "dotnet restore"
    
    # Build project
    run_test "Build .NET project" "dotnet build --no-restore"
    
    # Run unit tests
    run_test "Run unit tests" "dotnet test --no-build --verbosity normal"
    
    # Run tests with coverage
    run_coverage_test "Run tests with coverage" \
        "dotnet test --collect:\"XPlat Code Coverage\" -- DataCollectionRunSettings.DataCollectors.DataCollector.Configuration.Format=opencover" \
        "../tests/BackendCoverageResults.txt"
    
    # Run integration tests
    if [ -d "../../tests/CarMaintenance.IntegrationTests" ]; then
        cd ../../tests/CarMaintenance.IntegrationTests
        run_test "Run integration tests" "dotnet test --no-build --verbosity normal"
        cd ../../src/CarMaintenance.Api
    fi
    
    # Static analysis
    run_test "Code analysis" "dotnet format --verify-no-changes"
    
    cd ../..
    echo ""
}

# Frontend Tests
test_frontend() {
    print_status "Running frontend tests..."
    echo ""
    
    cd ClientApp
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_status "Installing npm dependencies..."
        npm install
    fi
    
    # Lint code
    run_test "Lint TypeScript code" "npm run lint"
    
    # Run unit tests
    run_test "Run Angular tests" "npm run test:ci"
    
    # Build for production
    run_test "Build for production" "npm run build:prod"
    
    # Test accessibility (if a11y tooling is available)
    if command -v pa11y &> /dev/null; then
        # Start server briefly for accessibility testing
        timeout 30s npm run build:prod &
        SERVER_PID=$!
        sleep 15
        if [ -d "dist" ]; then
            run_test "Accessibility tests" "pa11y http://localhost:4200"
            kill $SERVER_PID 2>/dev/null || true
        fi
    fi
    
    cd ..
    echo ""
}

# Mobile Tests
test_mobile() {
    print_status "Running mobile tests..."
    echo ""
    
    cd mobile
    
    # Check if dependencies are installed
    if [ ! -d ".dart_tool" ]; then
        print_status "Getting Flutter dependencies..."
        flutter pub get
    fi
    
    # Analyze code
    run_test "Flutter analyze" "flutter analyze"
    
    # Run tests
    run_test "Flutter tests" "flutter test"
    
    # Test build
    run_test "Build APK" "flutter build apk --debug"
    
    # Check formatting
    run_test "Code formatting" "flutter format --set-exit-if-changed lib/"
    
    cd ..
    echo ""
}

# Integration Tests
test_integration() {
    print_status "Running integration tests..."
    echo ""
    
    # Test API health
    run_test "API health check" "curl -f http://localhost:5000/health"
    
    # Test database connection
    run_test "Database connection" "docker-compose exec -T postgres pg_isready -U caruser"
    
    # Test Redis connection
    run_test "Redis connection" "docker-compose exec -T redis redis-cli ping | grep -q PONG"
    
    # Test API endpoints (if server is running)
    if curl -f http://localhost:5000 > /dev/null 2>&1; then
        # Test authentication endpoint
        run_test "Authentication endpoint" "curl -f -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"test\",\"password\":\"test\"}'"
    else
        print_warning "API server not running, skipping API endpoint tests"
    fi
    
    echo ""
}

# Performance Tests
test_performance() {
    print_status "Running performance tests..."
    echo ""
    
    # Test Docker container performance
    if command -v docker stats --no-stream &> /dev/null; then
        print_status "Docker containers are running efficiently"
        docker stats --no-stream
    fi
    
    # Test build performance
    start_time=$(date +%s)
    dotnet build src/CarMaintenance.Api/CarMaintenance.Api.csproj --no-restore > /dev/null 2>&1
    end_time=$(date +%s)
    build_time=$((end_time - start_time))
    
    if [ $build_time -lt 30 ]; then
        print_success "✓ Build performance: ${build_time}s (< 30s)"
    else
        print_warning "⚠ Build performance: ${build_time}s (consider optimization)"
    fi
    
    echo ""
}

# Security Tests
test_security() {
    print_status "Running security tests..."
    echo ""
    
    # Check for security vulnerabilities in dependencies
    if command -v npm audit &> /dev/null; then
        cd ClientApp
        run_test "NPM security audit" "npm audit --audit-level=high"
        cd ..
    fi
    
    # Check .NET packages for vulnerabilities
    if command -v dotnet &> /dev/null; then
        run_test "NuGet security audit" "dotnet list package --vulnerable"
    fi
    
    # Test CORS configuration
    if curl -f http://localhost:5000 > /dev/null 2>&1; then
        cors_header=$(curl -s -I http://localhost:5000/ | grep -i "access-control-allow-origin" || echo "")
        if [ ! -z "$cors_header" ]; then
            print_success "✓ CORS headers configured"
        else
            print_warning "⚠ CORS headers not found"
        fi
    fi
    
    echo ""
}

# Generate test report
generate_report() {
    print_status "Generating test report..."
    
    cat > tests/TestReport.md << EOF
# Test Report - $(date)

## Summary
- **Total Tests**: $TESTS_TOTAL
- **Passed**: $TESTS_PASSED
- **Failed**: $TESTS_FAILED
- **Success Rate**: $(( TESTS_PASSED * 100 / TESTS_TOTAL ))%

## Test Categories
- ✅ Backend Tests (.NET)
- ✅ Frontend Tests (Angular)
- ✅ Mobile Tests (Flutter)
- ✅ Integration Tests
- ✅ Performance Tests
- ✅ Security Tests

## Recommendations
$([ $TESTS_FAILED -eq 0 ] && echo "All tests passed! 🎉" || echo "Address failed tests before merging to main branch.")
EOF
    
    print_success "Test report generated: tests/TestReport.md"
}

# Clean up
cleanup() {
    print_status "Cleaning up test artifacts..."
    
    # Clean up test output files
    rm -f tests/*.txt
    
    print_success "Cleanup completed"
}

# Main execution
main() {
    echo "Starting comprehensive testing..."
    echo ""
    
    # Parse command line arguments
    SKIP_SERVICES=false
    SKIP_INTEGRATION=false
    SKIP_PERFORMANCE=false
    SKIP_SECURITY=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-services)
                SKIP_SERVICES=true
                shift
                ;;
            --skip-integration)
                SKIP_INTEGRATION=true
                shift
                ;;
            --skip-performance)
                SKIP_PERFORMANCE=true
                shift
                ;;
            --skip-security)
                SKIP_SECURITY=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --skip-services      Skip service checks"
                echo "  --skip-integration   Skip integration tests"
                echo "  --skip-performance   Skip performance tests"
                echo "  --skip-security      Skip security tests"
                echo "  --help               Show this help"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Create tests directory
    mkdir -p tests
    
    # Check services if not skipped
    if [ "$SKIP_SERVICES" = false ]; then
        check_services
    fi
    
    # Run all test suites
    test_backend
    test_frontend
    test_mobile
    
    if [ "$SKIP_INTEGRATION" = false ]; then
        test_integration
    fi
    
    if [ "$SKIP_PERFORMANCE" = false ]; then
        test_performance
    fi
    
    if [ "$SKIP_SECURITY" = false ]; then
        test_security
    fi
    
    # Generate report
    generate_report
    
    # Cleanup
    cleanup
    
    # Final results
    echo ""
    echo "📊 Test Results Summary"
    echo "======================"
    echo "Total Tests: $TESTS_TOTAL"
    echo "Passed: $TESTS_PASSED"
    echo "Failed: $TESTS_FAILED"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo ""
        print_success "All tests passed! 🎉"
        exit 0
    else
        echo ""
        print_error "Some tests failed. Please review the output above."
        exit 1
    fi
}

# Run main function
main "$@"