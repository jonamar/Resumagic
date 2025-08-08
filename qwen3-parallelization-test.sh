#!/bin/bash

# Qwen3 Parallelization Production Test
# Tests qwen3:0.6b vs phi3:mini with different OLLAMA_NUM_PARALLEL settings
# Using realistic candidate profiles and proper temperature settings

echo "🚀 Starting qwen3:0.6b parallelization production test"
echo "Testing against realistic candidate profiles with fixed temperature settings"
echo ""

# Test configurations
MODELS=("phi3:mini" "qwen3:0.6b")
PARALLEL_SETTINGS=(4 8)
CANDIDATES=("weak-candidate" "average-candidate" "strong-candidate")
RUNS=2  # 2 runs per config for statistical validation

# Results files
RESULTS_FILE="qwen3-parallelization-test-results.json"
SAMPLES_DIR="test-samples"
echo "[]" > "$RESULTS_FILE"
mkdir -p "$SAMPLES_DIR"

# Function to run a single test
run_test() {
    local model=$1
    local parallel=$2
    local candidate=$3
    local run_num=$4
    
    echo "🔄 Testing: $model with OLLAMA_NUM_PARALLEL=$parallel on $candidate (run $run_num/$RUNS)"
    
    # Record start time
    start_time=$(date +%s)
    start_timestamp=$(date -Iseconds)
    
    # Run the evaluation
    if node dist/generate-resume.js "$candidate" --evaluate --eval-model "$model" --eval-parallel "$parallel" > /dev/null 2>&1; then
        # Calculate duration
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        
        # Quality validation
        eval_file="/Users/jonamar/Documents/resumagic/data/applications/$candidate/working/evaluation-results.json"
        if [[ -f "$eval_file" ]]; then
            # Calculate score range across personas
            score_range=$(jq -r '[.evaluations[].overall_assessment.persona_score] | max - min' "$eval_file" 2>/dev/null || echo "null")
            # Check if JSON is valid
            json_valid=$(jq . "$eval_file" > /dev/null 2>&1 && echo "true" || echo "false")
            # Count personas
            persona_count=$(jq -r '[.evaluations[]] | length' "$eval_file" 2>/dev/null || echo "0")
            
            # Save sample for first run of each config
            if [[ $run_num -eq 1 ]]; then
                sample_file="$SAMPLES_DIR/${model}_${candidate}_parallel${parallel}_sample.json"
                cp "$eval_file" "$sample_file"
                echo "   📋 Sample saved: $sample_file"
            fi
        else
            score_range="null"
            json_valid="false" 
            persona_count="0"
        fi
        
        # Record result with quality metrics
        result=$(cat <<EOF
{
  "timestamp": "$start_timestamp",
  "model": "$model",
  "parallel": $parallel,
  "candidate": "$candidate",
  "run": $run_num,
  "duration_seconds": $duration,
  "status": "success",
  "score_range": $score_range,
  "json_valid": $json_valid,
  "persona_count": $persona_count
}
EOF
        )
        
        # Append to results
        temp_file=$(mktemp)
        jq ". += [$result]" "$RESULTS_FILE" > "$temp_file" && mv "$temp_file" "$RESULTS_FILE"
        
        echo "   ✅ Completed in ${duration}s (range: $score_range)"
    else
        echo "   ❌ Failed"
        
        # Record failure
        result=$(cat <<EOF
{
  "timestamp": "$start_timestamp",
  "model": "$model",
  "parallel": $parallel,
  "candidate": "$candidate",
  "run": $run_num,
  "duration_seconds": null,
  "status": "failed",
  "score_range": null,
  "json_valid": false,
  "persona_count": 0
}
EOF
        )
        
        # Append to results
        temp_file=$(mktemp)
        jq ". += [$result]" "$RESULTS_FILE" > "$temp_file" && mv "$temp_file" "$RESULTS_FILE"
    fi
    
    # Brief pause between tests
    sleep 2
}

# Run test matrix
total_tests=$((${#MODELS[@]} * ${#PARALLEL_SETTINGS[@]} * ${#CANDIDATES[@]} * RUNS))
current_test=0

for model in "${MODELS[@]}"; do
    for parallel in "${PARALLEL_SETTINGS[@]}"; do
        for candidate in "${CANDIDATES[@]}"; do
            for run in $(seq 1 $RUNS); do
                current_test=$((current_test + 1))
                echo "[$current_test/$total_tests]"
                run_test "$model" "$parallel" "$candidate" "$run"
                echo ""
            done
        done
    done
done

echo "🎯 Test matrix completed!"
echo "📊 Results saved to: $RESULTS_FILE"

# Generate summary
echo ""
echo "📋 PERFORMANCE SUMMARY:"
jq -r '
  group_by(.model, .parallel) | 
  map({
    model: .[0].model,
    parallel: .[0].parallel,
    avg_duration: (map(select(.status == "success").duration_seconds) | add / length),
    success_rate: (map(select(.status == "success")) | length) / length * 100,
    avg_score_range: (map(select(.status == "success" and .score_range != null).score_range) | add / length),
    candidates_tested: (map(.candidate) | unique | length)
  }) | 
  .[] | 
  "  \(.model) @ parallel=\(.parallel): \(.avg_duration // "N/A")s avg, \(.success_rate)% success, \(.avg_score_range // "N/A") score range (\(.candidates_tested) candidates)"
' "$RESULTS_FILE"

echo ""
echo "🎯 QUALITY VALIDATION:"
jq -r '
  map(select(.status == "success")) | 
  group_by(.model, .parallel) | 
  map({
    config: "\(.[0].model) @ parallel=\(.[0].parallel)",
    json_valid: (map(select(.json_valid == true)) | length),
    total: length,
    persona_6_count: (map(select(.persona_count == 6)) | length),
    score_ranges: [.[].score_range | select(. != null)]
  }) | 
  .[] | 
  "  \(.config): \(.json_valid)/\(.total) valid JSON, \(.persona_6_count)/\(.total) complete (6 personas), ranges: \(.score_ranges | @json)"
' "$RESULTS_FILE"

echo ""
echo "🔬 Analysis:"

# Calculate performance improvement
phi3_baseline=$(jq -r '
  map(select(.model == "phi3:mini" and .parallel == 4 and .status == "success")) |
  map(.duration_seconds) | add / length
' "$RESULTS_FILE")

qwen3_test=$(jq -r '
  map(select(.model == "qwen3:0.6b" and .parallel == 8 and .status == "success")) |
  map(.duration_seconds) | add / length
' "$RESULTS_FILE")

if [[ "$phi3_baseline" != "null" && "$qwen3_test" != "null" ]]; then
    improvement=$(echo "scale=1; (($phi3_baseline - $qwen3_test) / $phi3_baseline) * 100" | bc)
    if (( $(echo "$improvement > 10" | bc -l) )); then
        echo "   ✅ SUCCESS: qwen3:0.6b @ parallel=8 is ${improvement}% faster than phi3:mini baseline"
    else
        echo "   ❌ HYPOTHESIS REJECTED: qwen3:0.6b improvement (${improvement}%) < 10% target"
    fi
else
    echo "   ⚠️ Insufficient data for comparison"
fi

echo ""
echo "📁 FILES GENERATED:"
echo "  📊 Results: $RESULTS_FILE"  
echo "  📋 Samples: $SAMPLES_DIR/"
ls -la "$SAMPLES_DIR"

echo ""
echo "📝 MANUAL REVIEW NEEDED:"
echo "  Review sample files for persona differentiation and reasoning quality"
echo "  Check that each persona provides unique, role-relevant insights"
echo "  Verify recommendations are sensible and actionable"