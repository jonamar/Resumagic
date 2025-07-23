#!/bin/bash

# Performance Regression Detection
# Part of Phase 1: CI/CD Extensions for Standardization Safety
# Automated baseline comparison for service migrations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP_DIR="$PROJECT_ROOT"
PERF_DIR="$APP_DIR/__tests__/performance"
BASELINE_FILE="$PERF_DIR/performance-baseline.json"
CURRENT_FILE="$PERF_DIR/performance-current.json"

print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_step() {
    echo -e "\n${BLUE}🔄 $1${NC}"
}

print_success() {
    print_status $GREEN "✅ $1"
}

print_warning() {
    print_status $YELLOW "⚠️ $1"
}

print_error() {
    print_status $RED "❌ $1"
}

# Create performance directories
setup_directories() {
    mkdir -p "$PERF_DIR"
}

# Benchmark core operations
run_performance_benchmark() {
    local output_file=$1
    local test_app="general-application"
    
    print_step "Running performance benchmark"
    
    cd "$APP_DIR"
    
    # Test operations with timing
    local results="{\n"
    results="$results  \"timestamp\": \"$(date -Iseconds)\",\n"
    results="$results  \"git_commit\": \"$(cd "$PROJECT_ROOT" && git rev-parse HEAD 2>/dev/null || echo 'unknown')\",\n"
    results="$results  \"benchmarks\": {\n"
    
    # 1. Linting performance
    print_status $YELLOW "  📏 Benchmarking linting performance..."
    local lint_start=$(date +%s)
    npm run lint > /dev/null 2>&1 || true
    local lint_end=$(date +%s)
    local lint_duration=$((lint_end - lint_start))
    lint_duration=$((lint_duration * 1000))  # Convert to milliseconds
    
    results="$results    \"linting_ms\": $lint_duration,\n"
    print_status $GREEN "    Linting: ${lint_duration}ms"
    
    # 2. Feature flag validation performance
    print_status $YELLOW "  🏁 Benchmarking feature flag validation..."
    local ff_start=$(date +%s)
    node scripts/feature-flags.js validate > /dev/null 2>&1 || true
    local ff_end=$(date +%s)
    local ff_duration=$((ff_end - ff_start))
    ff_duration=$((ff_duration * 1000))  # Convert to milliseconds
    
    results="$results    \"feature_flag_validation_ms\": $ff_duration,\n"
    print_status $GREEN "    Feature flags: ${ff_duration}ms"
    
    # 3. Document generation performance (if test app exists)
    if [ -d "../data/applications/$test_app" ]; then
        print_status $YELLOW "  📄 Benchmarking document generation..."
        local doc_start=$(date +%s)
        timeout 30s node generate-resume.js "$test_app" --quiet > /dev/null 2>&1 || true
        local doc_end=$(date +%s)
        local doc_duration=$((doc_end - doc_start))
        doc_duration=$((doc_duration * 1000))  # Convert to milliseconds
        
        results="$results    \"document_generation_ms\": $doc_duration,\n"
        print_status $GREEN "    Document generation: ${doc_duration}ms"
    else
        results="$results    \"document_generation_ms\": null,\n"
        print_warning "    Document generation: skipped (no test app)"
    fi
    
    # 4. Test suite performance
    print_status $YELLOW "  🧪 Benchmarking test suite performance..."
    local test_start=$(date +%s)
    timeout 45s npm run test:ci > /dev/null 2>&1 || true
    local test_end=$(date +%s)
    local test_duration=$((test_end - test_start))
    test_duration=$((test_duration * 1000))  # Convert to milliseconds
    
    results="$results    \"test_suite_ms\": $test_duration\n"
    print_status $GREEN "    Test suite: ${test_duration}ms"
    
    results="$results  }\n"
    results="$results}"
    
    # Write results to file
    echo -e "$results" > "$output_file"
    
    print_success "Performance benchmark completed"
    print_status $GREEN "📁 Results saved to: $output_file"
}

# Generate performance baseline
generate_baseline() {
    print_step "Generating performance baseline"
    
    setup_directories
    
    # Run benchmark and save as baseline
    run_performance_benchmark "$BASELINE_FILE"
    
    print_success "Performance baseline generated"
    print_status $GREEN "📊 Baseline saved to: $BASELINE_FILE"
    
    # Display baseline summary
    if command -v jq >/dev/null 2>&1; then
        echo ""
        print_status $BLUE "📈 Baseline Performance Summary:"
        jq -r '.benchmarks | to_entries[] | "  \(.key | gsub("_"; " ") | ascii_upcase): \(.value)ms"' "$BASELINE_FILE" || true
    fi
}

# Compare current performance against baseline
run_comparison() {
    print_step "Running performance regression detection"
    
    if [ ! -f "$BASELINE_FILE" ]; then
        print_error "No performance baseline found. Run with --generate-baseline first"
        exit 1
    fi
    
    setup_directories
    
    # Run current benchmark
    run_performance_benchmark "$CURRENT_FILE"
    
    # Compare results
    print_step "Analyzing performance differences"
    
    local regression_detected=false
    local regression_threshold=20  # 20% slowdown threshold
    
    if command -v jq >/dev/null 2>&1; then
        # Use jq for JSON comparison
        local baseline_linting=$(jq -r '.benchmarks.linting_ms' "$BASELINE_FILE" 2>/dev/null || echo "0")
        local current_linting=$(jq -r '.benchmarks.linting_ms' "$CURRENT_FILE" 2>/dev/null || echo "0")
        
        local baseline_ff=$(jq -r '.benchmarks.feature_flag_validation_ms' "$BASELINE_FILE" 2>/dev/null || echo "0")
        local current_ff=$(jq -r '.benchmarks.feature_flag_validation_ms' "$CURRENT_FILE" 2>/dev/null || echo "0")
        
        local baseline_doc=$(jq -r '.benchmarks.document_generation_ms' "$BASELINE_FILE" 2>/dev/null || echo "0")
        local current_doc=$(jq -r '.benchmarks.document_generation_ms' "$CURRENT_FILE" 2>/dev/null || echo "0")
        
        local baseline_test=$(jq -r '.benchmarks.test_suite_ms' "$BASELINE_FILE" 2>/dev/null || echo "0")
        local current_test=$(jq -r '.benchmarks.test_suite_ms' "$CURRENT_FILE" 2>/dev/null || echo "0")
        
        # Check for regressions
        check_regression "Linting" "$baseline_linting" "$current_linting" "$regression_threshold" || regression_detected=true
        check_regression "Feature Flag Validation" "$baseline_ff" "$current_ff" "$regression_threshold" || regression_detected=true
        
        if [ "$baseline_doc" != "null" ] && [ "$current_doc" != "null" ]; then
            check_regression "Document Generation" "$baseline_doc" "$current_doc" "$regression_threshold" || regression_detected=true
        fi
        
        check_regression "Test Suite" "$baseline_test" "$current_test" "$regression_threshold" || regression_detected=true
        
    else
        print_warning "jq not available, skipping detailed performance analysis"
        print_status $YELLOW "💡 Install jq for detailed performance regression detection"
    fi
    
    if [ "$regression_detected" = true ]; then
        print_error "Performance regression detected!"
        print_status $RED "📉 Review performance changes before proceeding"
        echo ""
        print_status $YELLOW "💡 Commands to investigate:"
        print_status $YELLOW "   cat $BASELINE_FILE"
        print_status $YELLOW "   cat $CURRENT_FILE"
        print_status $YELLOW "   $0 --generate-baseline  # to update baseline if changes are expected"
        exit 1
    else
        print_success "No significant performance regression detected"
        print_status $GREEN "🚀 Performance within acceptable thresholds"
        return 0
    fi
}

# Helper function to check individual benchmark regression
check_regression() {
    local name=$1
    local baseline=$2
    local current=$3
    local threshold=$4
    
    # Skip if either value is 0 or null
    if [ "$baseline" = "0" ] || [ "$current" = "0" ] || [ "$baseline" = "null" ] || [ "$current" = "null" ]; then
        print_status $BLUE "  $name: skipped (missing data)"
        return 0
    fi
    
    # Calculate percentage change
    local change=$(( (current - baseline) * 100 / baseline ))
    
    if [ $change -gt $threshold ]; then
        print_status $RED "  $name: REGRESSION detected (+${change}%, ${baseline}ms → ${current}ms)"
        return 1
    elif [ $change -gt 5 ]; then
        print_status $YELLOW "  $name: Minor slowdown (+${change}%, ${baseline}ms → ${current}ms)"
    else
        print_status $GREEN "  $name: OK (${change:+$change%}, ${baseline}ms → ${current}ms)"
    fi
    
    return 0
}

# Main execution logic
main() {
    case "${1:-}" in
        --generate-baseline)
            print_status $BLUE "🏗️  Generating Performance Baseline"
            generate_baseline
            ;;
        --compare|--check)
            print_status $BLUE "🔍 Running Performance Regression Detection"
            run_comparison
            ;;
        --help|-h)
            echo "Performance Regression Detection"
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  --generate-baseline    Generate new performance baseline"
            echo "  --compare, --check     Compare current performance against baseline"
            echo "  --help, -h            Show this help"
            echo ""
            echo "Performance regression detection helps catch performance degradation"
            echo "during the standardization process."
            ;;
        *)
            print_status $BLUE "🔍 Running Performance Regression Check (default)"
            run_comparison
            ;;
    esac
}

# Execute main function
main "$@"
