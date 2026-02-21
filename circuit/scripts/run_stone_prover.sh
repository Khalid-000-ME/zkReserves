#!/bin/bash
set -e

# ==============================================================================
# TRUE ZK RUNNER
# ==============================================================================
# This script orchestrates the generation of an off-chain ZK-STARK proof 
# using native cairo1-run and LambdaClass stone-prover.
# ==============================================================================

echo ">> WRITING PROVER CONFIGURATIONS..."
cat << 'EOF' > cpu_air_params.json
{
    "field": "PrimeB",
    "stark": {
        "fri": {
            "fri_step_list": [0, 4, 3],
            "last_layer_degree_bound": 64,
            "n_queries": 18,
            "proof_of_work_bits": 24
        },
        "log_n_cosets": 4
    }
}
EOF

cat << 'EOF' > cpu_air_prover_config.json
{
    "constraint_polynomial_task_size": 256,
    "n_out_of_memory_merkle_layers": 1,
    "store_full_l_deform": false,
    "table_prover_params": {
        "table_n_tasks": 1
    }
}
EOF

echo ">> COMPILING MAIN CIRCUIT TO SIERRA..."
scarb --release build

CASM_FILE="target/release/zkreserves_circuit.sierra.json"

if [ ! -f "$CASM_FILE" ]; then
    echo ">> [ERROR] Sierra binary failed to compile. Please check circuit constraints."
    exit 1
fi

echo ">> GENERATING CAIRO TRACE AND MEMORY DUMP (cairo1-run)..."
# We use cairo1-run which accepts the sierra constraints natively
cairo-run \
  $CASM_FILE \
  --proof_mode \
  --trace_file zkreserves_trace.bin \
  --memory_file zkreserves_memory.bin \
  --air_public_input public_input.json \
  --args "private_input.json"

echo ">> GENERATING MATHEMATICAL ZK-STARK ( STONE PROVER )" 
cpu_prover \
  --parameter_file=cpu_air_params.json \
  --prover_config_file=cpu_air_prover_config.json \
  --public_input_file=public_input.json \
  --private_input_file=private_input.json \
  --out_file=stark_proof.json

echo ">> PROOF GENERATED: stark_proof.json"
