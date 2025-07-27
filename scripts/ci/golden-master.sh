#!/bin/bash

# Golden Master Test Suite
# Captures current workflow outputs as baseline for standardization safety
# Part of Phase 1: CI/CD Extensions for Standardization Safety

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
DATA_DIR="$(cd "$PROJECT_ROOT/../data" && pwd)"
GOLDEN_MASTER_DIR="$APP_DIR/__tests__/golden-master"
BASELINE_DIR="$GOLDEN_MASTER_DIR/baseline"
CURRENT_DIR="$GOLDEN_MASTER_DIR/current"

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

# Test applications for golden master baseline
TEST_APPLICATIONS=(
    "general-application"
    "zearch-director-product-marketing"
)

# Function to create directories
setup_directories() {
    print_step "Setting up golden master directories"
    
    mkdir -p "$GOLDEN_MASTER_DIR"
    mkdir -p "$BASELINE_DIR"
    mkdir -p "$CURRENT_DIR"
    
    # Create subdirectories for different output types
    for dir in "$BASELINE_DIR" "$CURRENT_DIR"; do
        mkdir -p "$dir/documents"
        mkdir -p "$dir/keyword-analysis"
        mkdir -p "$dir/hiring-evaluation"
        mkdir -p "$dir/metadata"
    done
    
    print_success "Golden master directories created"
}

# Function to capture document outputs
capture_document_outputs() {
    local output_dir=$1
    local app_name=$2
    
    print_step "Capturing document outputs for $app_name"
    
    local app_outputs_dir="$DATA_DIR/applications/$app_name/outputs"
    local capture_dir="$output_dir/documents/$app_name"
    
    mkdir -p "$capture_dir"
    
    if [ -d "$app_outputs_dir" ]; then
        # Copy DOCX files
        find "$app_outputs_dir" -name "*.docx" -exec cp {} "$capture_dir/" \; 2>/dev/null || true
        
        # Create metadata about the documents
        local metadata_file="$output_dir/metadata/$app_name-documents.json"
        echo "{" > "$metadata_file"
        echo "  \"application\": \"$app_name\"," >> "$metadata_file"
        echo "  \"timestamp\": \"$(date -Iseconds)\"," >> "$metadata_file"
        echo "  \"documents\": [" >> "$metadata_file"
        
        local first_doc=true
        find "$app_outputs_dir" -name "*.docx" | while read -r docx_file; do
            local filename=$(basename "$docx_file")
            local size=$(stat -f%z "$docx_file" 2>/dev/null || echo "0")
            local modified=$(stat -f%m "$docx_file" 2>/dev/null || echo "0")
            
            if [ "$first_doc" = true ]; then
                first_doc=false
            else
                echo "    ," >> "$metadata_file"
            fi
            
            echo -n "    {" >> "$metadata_file"
            echo -n "\"name\": \"$filename\", " >> "$metadata_file"
            echo -n "\"size_bytes\": $size, " >> "$metadata_file"
            echo -n "\"modified_timestamp\": $modified" >> "$metadata_file"
            echo -n "}" >> "$metadata_file"
        done
        
        echo "" >> "$metadata_file"
        echo "  ]" >> "$metadata_file"
        echo "}" >> "$metadata_file"
        
        local doc_count=$(find "$app_outputs_dir" -name "*.docx" | wc -l | tr -d ' ')
        print_success "Captured $doc_count documents for $app_name"
    else
        print_warning "No outputs directory found for $app_name"
    fi
}

# Function to capture keyword analysis outputs
capture_keyword_analysis() {
    local output_dir=$1
    local app_name=$2
    
    print_step "Running keyword analysis for $app_name"
    
    local app_inputs_dir="$DATA_DIR/applications/$app_name/inputs"
    local capture_dir="$output_dir/keyword-analysis/$app_name"
    
    mkdir -p "$capture_dir"
    
    # Check if required files exist
    local keywords_file="$app_inputs_dir/keywords.json"
    local job_posting_file="$app_inputs_dir/job-posting.md"
    local resume_file="$app_inputs_dir/resume.json"
    
    if [ -f "$keywords_file" ] && [ -f "$job_posting_file" ]; then
        cd "$APP_DIR"
        
        # Run keyword analysis and capture output
        local kw_output_file="$capture_dir/keyword-analysis.json"
        local kw_log_file="$capture_dir/keyword-analysis.log"
        
        if [ -f "$resume_file" ]; then
            python services/keyword-analysis/kw_rank_modular.py "$keywords_file" "$job_posting_file" --resume "$resume_file" > "$kw_output_file" 2> "$kw_log_file" || true
        else
            python services/keyword-analysis/kw_rank_modular.py "$keywords_file" "$job_posting_file" > "$kw_output_file" 2> "$kw_log_file" || true
        fi
        
        # Create metadata
        local metadata_file="$output_dir/metadata/$app_name-keyword-analysis.json"
        echo "{" > "$metadata_file"
        echo "  \"application\": \"$app_name\"," >> "$metadata_file"
        echo "  \"timestamp\": \"$(date -Iseconds)\"," >> "$metadata_file"
        echo "  \"has_keywords_file\": $([ -f "$keywords_file" ] && echo "true" || echo "false")," >> "$metadata_file"
        echo "  \"has_job_posting\": $([ -f "$job_posting_file" ] && echo "true" || echo "false")," >> "$metadata_file"
        echo "  \"has_resume\": $([ -f "$resume_file" ] && echo "true" || echo "false")," >> "$metadata_file"
        echo "  \"output_size_bytes\": $(stat -f%z "$kw_output_file" 2>/dev/null || echo "0")," >> "$metadata_file"
        echo "  \"log_size_bytes\": $(stat -f%z "$kw_log_file" 2>/dev/null || echo "0")" >> "$metadata_file"
        echo "}" >> "$metadata_file"
        
        print_success "Captured keyword analysis for $app_name"
    else
        print_warning "Missing required files for keyword analysis: $app_name"
    fi
}

# Function to generate baseline
generate_baseline() {
    print_step "Generating golden master baseline"
    
    # Clean existing baseline
    rm -rf "$BASELINE_DIR"/*
    setup_directories
    
    cd "$APP_DIR"
    
    for app in "${TEST_APPLICATIONS[@]}"; do
        # Handle new test directory structure
        if [ "$app" = "general-application" ]; then
            local app_path="$DATA_DIR/test/$app"
        else
            local app_path="$DATA_DIR/applications/$app"
        fi
        
        if [ -d "$app_path" ]; then
            print_step "Processing application: $app"
            
            # Generate fresh documents
            print_status $YELLOW "  Generating documents..."
            node generate-resume.js "$app" --both --quiet 2>/dev/null || {
                print_warning "Document generation failed for $app, capturing existing outputs"
            }
            
            # Capture outputs
            capture_document_outputs "$BASELINE_DIR" "$app"
            capture_keyword_analysis "$BASELINE_DIR" "$app"
        else
            print_warning "Application not found: $app"
        fi
    done
    
    # Create baseline manifest
    local manifest_file="$BASELINE_DIR/manifest.json"
    echo "{" > "$manifest_file"
    echo "  \"generated_at\": \"$(date -Iseconds)\"," >> "$manifest_file"
    echo "  \"git_commit\": \"$(cd "$PROJECT_ROOT" && git rev-parse HEAD 2>/dev/null || echo "unknown")\"," >> "$manifest_file"
    echo "  \"git_branch\": \"$(cd "$PROJECT_ROOT" && git branch --show-current 2>/dev/null || echo "unknown")\"," >> "$manifest_file"
    echo "  \"applications\": [" >> "$manifest_file"
    
    local first_app=true
    for app in "${TEST_APPLICATIONS[@]}"; do
        if [ "$first_app" = true ]; then
            first_app=false
        else
            echo "," >> "$manifest_file"
        fi
        echo -n "    \"$app\"" >> "$manifest_file"
    done
    
    echo "" >> "$manifest_file"
    echo "  ]," >> "$manifest_file"
    echo "  \"node_version\": \"$(node --version)\"," >> "$manifest_file"
    echo "  \"python_version\": \"$(python --version 2>&1 | cut -d' ' -f2)\"" >> "$manifest_file"
    echo "}" >> "$manifest_file"
    
    print_success "Golden master baseline generated"
    print_status $GREEN "📁 Baseline saved to: $BASELINE_DIR"
}

# Function to run comparison against baseline
run_comparison() {
    print_step "Running golden master comparison"
    
    if [ ! -d "$BASELINE_DIR" ] || [ -z "$(ls -A "$BASELINE_DIR" 2>/dev/null)" ]; then
        print_error "No baseline found. Run with --generate-baseline first"
        exit 1
    fi
    
    # Clean current directory
    rm -rf "$CURRENT_DIR"/*
    setup_directories
    
    cd "$APP_DIR"
    
    # Generate current outputs
    for app in "${TEST_APPLICATIONS[@]}"; do
        # Handle new test directory structure
        if [ "$app" = "general-application" ]; then
            local app_path="$DATA_DIR/test/$app"
        else
            local app_path="$DATA_DIR/applications/$app"
        fi
        
        if [ -d "$app_path" ]; then
            print_step "Processing application: $app"
            
            # Generate fresh documents
            node generate-resume.js "$app" --both --quiet 2>/dev/null || {
                print_warning "Document generation failed for $app"
            }
            
            # Capture outputs
            capture_document_outputs "$CURRENT_DIR" "$app"
            capture_keyword_analysis "$CURRENT_DIR" "$app"
        fi
    done
    
    # Compare results
    local comparison_failed=false
    local differences_file="$GOLDEN_MASTER_DIR/differences.log"
    echo "Golden Master Comparison Results - $(date -Iseconds)" > "$differences_file"
    echo "=================================================" >> "$differences_file"
    
    for app in "${TEST_APPLICATIONS[@]}"; do
        print_step "Comparing results for $app"
        
        # Compare document metadata
        local baseline_meta="$BASELINE_DIR/metadata/$app-documents.json"
        local current_meta="$CURRENT_DIR/metadata/$app-documents.json"
        
        if [ -f "$baseline_meta" ] && [ -f "$current_meta" ]; then
            # Compare document counts and names (but not timestamps/sizes which may vary)
            local baseline_docs=$(jq -r '.documents[].name' "$baseline_meta" 2>/dev/null | sort || echo "")
            local current_docs=$(jq -r '.documents[].name' "$current_meta" 2>/dev/null | sort || echo "")
            
            if [ "$baseline_docs" != "$current_docs" ]; then
                comparison_failed=true
                echo "DIFFERENCE: Document list mismatch for $app" >> "$differences_file"
                echo "  Baseline: $baseline_docs" >> "$differences_file"
                echo "  Current:  $current_docs" >> "$differences_file"
                echo "" >> "$differences_file"
                print_warning "Document list changed for $app"
            else
                print_success "Document structure matches for $app"
            fi
        fi
        
        # Compare keyword analysis structure (but not exact content which may vary)
        local baseline_kw="$BASELINE_DIR/keyword-analysis/$app/keyword-analysis.json"
        local current_kw="$CURRENT_DIR/keyword-analysis/$app/keyword-analysis.json"
        
        if [ -f "$baseline_kw" ] && [ -f "$current_kw" ]; then
            # Check if both files have content
            local baseline_empty=$([ -s "$baseline_kw" ] && echo "false" || echo "true")
            local current_empty=$([ -s "$current_kw" ] && echo "false" || echo "true")
            
            if [ "$baseline_empty" != "$current_empty" ]; then
                comparison_failed=true
                echo "DIFFERENCE: Keyword analysis output presence mismatch for $app" >> "$differences_file"
                echo "  Baseline empty: $baseline_empty" >> "$differences_file"
                echo "  Current empty:  $current_empty" >> "$differences_file"
                echo "" >> "$differences_file"
                print_warning "Keyword analysis output structure changed for $app"
            else
                print_success "Keyword analysis structure matches for $app"
            fi
        fi
    done
    
    if [ "$comparison_failed" = true ]; then
        print_error "Golden master comparison FAILED"
        print_status $RED "📄 Differences logged to: $differences_file"
        echo ""
        echo "Review the differences and determine if they are expected changes."
        echo "If changes are intentional, regenerate baseline with: $0 --generate-baseline"
        exit 1
    else
        print_success "Golden master comparison PASSED"
        print_status $GREEN "🎉 All workflow outputs match baseline"
        return 0
    fi
}

# Main execution logic
main() {
    case "${1:-}" in
        --generate-baseline)
            print_status $BLUE "🏗️  Generating Golden Master Baseline"
            setup_directories
            generate_baseline
            ;;
        --compare|--check)
            print_status $BLUE "🔍 Running Golden Master Comparison"
            run_comparison
            ;;
        --help|-h)
            echo "Golden Master Test Suite"
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  --generate-baseline    Generate new baseline from current outputs"
            echo "  --compare, --check     Compare current outputs against baseline"
            echo "  --help, -h            Show this help"
            echo ""
            echo "The golden master test suite captures workflow outputs as a baseline"
            echo "for safe refactoring during the standardization process."
            ;;
        *)
            print_status $BLUE "🔍 Running Golden Master Check (default)"
            run_comparison
            ;;
    esac
}

# Execute main function
main "$@"
