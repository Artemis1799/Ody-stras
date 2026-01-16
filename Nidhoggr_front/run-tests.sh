#!/bin/bash

##############################################################################
#
# Test Runner Helper Script for Nidhoggr Frontend
# 
# This script provides an interactive menu for running different test scenarios
# Usage: ./run-tests.sh
#
##############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if npm is installed
check_dependencies() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    print_success "npm is installed"
}

# Check if node_modules exists
check_node_modules() {
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules not found, installing dependencies..."
        npm install
    else
        print_success "Dependencies are installed"
    fi
}

# Run all tests once
run_all_tests() {
    print_header "Running all tests (one time, watch mode)"
    print_info "Note: ChromeHeadless is not available. Running in watch mode."
    npm run test
    
    if [ $? -eq 0 ]; then
        print_success "Tests started!"
    else
        print_error "Tests failed to start"
        return 1
    fi
}

# Run tests with coverage
run_with_coverage() {
    print_header "Running tests with coverage report"
    print_warning "Note: Coverage requires ng test framework. Running basic test coverage..."
    npm run test:coverage
    
    if [ $? -eq 0 ]; then
        print_success "Coverage report should be generated"
        echo ""
        print_info "Coverage location: ./coverage/index.html"
        read -p "Open coverage report in browser? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if command -v open &> /dev/null; then
                open coverage/index.html 2>/dev/null || print_warning "Could not open browser"
            elif command -v xdg-open &> /dev/null; then
                xdg-open coverage/index.html 2>/dev/null || print_warning "Could not open browser"
            elif command -v start &> /dev/null; then
                start coverage/index.html 2>/dev/null || print_warning "Could not open browser"
            else
                print_warning "No browser launcher found"
            fi
        fi
    else
        print_warning "Coverage report generation may have issues (Chrome not available)"
    fi
}

# Run tests in watch mode
run_watch_mode() {
    print_header "Running tests in watch mode"
    print_info "Press Ctrl+C to stop"
    npm run test:watch
}

# Run specific test file
run_specific_test() {
    print_header "Run specific test file"
    echo "Available test files:"
    echo "1) export-popup.spec.ts"
    echo "2) import-popup.spec.ts"
    echo ""
    read -p "Select test file (1-2): " choice
    
    case $choice in
        1) npm test -- --include='**/export-popup.spec.ts' ;;
        2) npm test -- --include='**/import-popup.spec.ts' ;;
        *) print_error "Invalid selection" ;;
    esac
}

# Run tests by pattern
run_by_pattern() {
    print_header "Run tests by pattern"
    print_info "Note: Pattern matching works with Karma's built-in test filtering"
    read -p "Enter pattern to search (e.g., 'export', 'import', 'geometry'): " pattern
    
    if [ -z "$pattern" ]; then
        print_error "Pattern cannot be empty"
        return 1
    fi
    
    print_info "Searching for tests matching pattern: '$pattern'"
    print_info "Starting Karma in watch mode - tests will filter by pattern..."
    echo ""
    npm test -- --grep="$pattern" 2>/dev/null || npm test
}

# Debug mode
run_debug_mode() {
    print_header "Running tests in debug mode"
    print_info "Steps:"
    print_info "1. Browser will open automatically"
    print_info "2. Click 'Debug' button"
    print_info "3. Open DevTools with F12"
    print_info "4. Set breakpoints and reload"
    print_info "5. Press Ctrl+C to stop"
    echo ""
    npm run test:debug
}

# View test files
view_test_files() {
    print_header "Test files structure"
    echo ""
    
    echo "Currently working test files:"
    echo "  - src/app/shared/export-popup/export-popup.spec.ts"
    echo "  - src/app/shared/import-popup/import-popup.spec.ts"
    echo ""
    
    echo "Tests to implement (with proper models):"
    echo "  - EventService.spec.ts (uses eventModel.ts)"
    echo "  - PointService.spec.ts (uses pointModel.ts)"
    echo "  - AreaService.spec.ts (uses areaModel.ts)"
    echo "  - Route/PathService tests (uses routePathModel.ts)"
    echo ""
}

# Show test metrics
show_metrics() {
    print_header "Test metrics and targets"
    echo ""
    echo "Coverage targets:"
    echo "  - Statements: ≥ 80%"
    echo "  - Branches:   ≥ 75%"
    echo "  - Functions:  ≥ 80%"
    echo "  - Lines:      ≥ 80%"
    echo ""
    echo "Performance targets:"
    echo "  - Initial Load:   < 2000ms"
    echo "  - Search:         < 500ms"
    echo "  - Color Update:   < 200ms"
    echo "  - Comment Save:   < 1000ms"
    echo ""
    echo "Run 'npm run test:coverage' to measure coverage"
}

# Show help
show_help() {
    print_header "Nidhoggr Frontend - Test Helper"
    echo ""
    echo "Quick commands (working in this environment):"
    echo "  npm test                  - Run tests in watch mode ✓"
    echo ""
    echo "Note: The following commands require ChromeHeadless (not available):"
    echo "  npm run test:once         - Run all tests once (CI mode) ✗"
    echo "  npm run test:coverage     - Run tests with coverage report ✗"
    echo "  npm run test:debug        - Run tests in debug mode ✗"
    echo ""
    echo "Currently available tests:"
    echo "  - export-popup.spec.ts"
    echo "  - import-popup.spec.ts"
    echo ""
    echo "Documentation:"
    echo "  - README_TESTS.md                 - Testing overview"
    echo "  - TESTING_GUIDE.md                - Complete testing guide"
    echo "  - TEST_PLAN.md                    - Detailed test plan"
}

# Show testing guidelines
show_guidelines() {
    print_header "Testing guidelines"
    echo ""
    echo "Current environment limitations:"
    echo "  ⚠ ChromeHeadless is not available"
    echo "  ✓ Tests run in watch mode via npm test"
    echo "  ✓ Can connect browser for live testing"
    echo ""
    echo "Best practices when adding tests:"
    echo "  ✓ Use npm test to run tests in watch mode"
    echo "  ✓ Update tests when code changes"
    echo "  ✓ Tests must compile without TypeScript errors"
    echo "  ✓ No references to non-existent services"
    echo ""
    echo "Test naming:"
    echo "  ✓ Describe blocks: 'NomDuService' or 'NomDuComposant'"
    echo "  ✓ Test names: Clear and descriptive"
    echo "  ✓ Use 'should' prefix for clarity"
    echo ""
    echo "Mocking best practices:"
    echo "  ✓ Use HttpClientTestingModule for HTTP"
    echo "  ✓ Use jasmine.createSpyObj for services"
    echo "  ✓ Mock Router and ActivatedRoute"
    echo "  ✓ Clean up with afterEach httpMock.verify()"
}

# Main menu
show_menu() {
    echo ""
    echo "Select an option:"
    echo "1) Run all tests in watch mode"
    echo "2) Run tests with coverage report"
    echo "3) Run specific test file"
    echo "4) Run tests by pattern"
    echo "5) View test files structure"
    echo "6) Show metrics and targets"
    echo "7) Show quick help"
    echo "8) Show testing guidelines"
    echo "9) Exit"
    echo ""
    read -p "Enter choice (1-9): " choice
    
    case $choice in
        1) run_all_tests ;;
        2) run_with_coverage ;;
        3) run_specific_test ;;
        4) run_by_pattern ;;
        5) view_test_files ;;
        6) show_metrics ;;
        7) show_help ;;
        8) show_guidelines ;;
        9) 
            print_info "Exiting..."
            return 1
            ;;
        *)
            print_error "Invalid choice"
            ;;
    esac
    return 0
}

# Main function
main() {
    clear
    print_header "Nidhoggr Frontend - Test Runner"
    
    check_dependencies
    check_node_modules
    
    echo ""
    while true; do
        show_menu
        if [ $? -eq 1 ]; then
            break
        fi
        echo ""
        read -p "Press Enter to continue..." -t 5 || true
        clear
    done
}

# Run main function
main
