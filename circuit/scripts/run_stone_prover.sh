#!/bin/bash
set -e

# ==============================================================================
# TRUE ZK RUNNER
# ==============================================================================
# This script orchestrates the generation of an off-chain ZK-STARK proof 
# using the native StarkWare cairo-run and stone-prover tools.
# 
# WARNING: Generating proofs requires massive compute resources (16GB+ RAM min).
# ==============================================================================

echo ">> COMPILING MAIN CIRCUIT TO SIERRA/CASM"
# Compile the custom Cairo program representing our constraints 
scarb --release build

# In an actual deployment, we extract the CASM JSON directly 
CASM_FILE="target/release/zkreserves_circuit.casm.json"

if [ ! -f "$CASM_FILE" ]; then
    echo ">> [ERROR] CASM binary failed to compile. Please check circuit constraints."
    exit 1
fi

echo ">> GENERATING CAIRO TRACE AND MEMORY DUMP"
# This step executes the program natively on the server and maps polynomial memory vectors
# Input would typically be dynamically passed as a serialized array representing wallet/liability data.
# Note: For massive liability trees, this command consumes massive CPU threads.
cairo-run \
  --program=$CASM_FILE \
  --layout=all_cairo \
  --trace_file=zkreserves_trace.bin \
  --memory_file=zkreserves_memory.bin \
  --proof_mode

echo ">> GENERATING MATHEMATICAL ZK-STARK ( STONE PROVER )"
# Here we hook the traces into the heavy Lambdaclass STARK prover via Docker.
# This mathematically seals the constraints without revealing private data.
docker run --rm -v $(pwd):/work -w /work ghcr.io/lambdaclass/stone-prover:latest cpu_prover \
  --parameter_file=cpu_air_params.json \
  --prover_config_file=cpu_air_prover_config.json \
  --public_input_file=public_input.json \
  --private_input_file=private_input.json \
  --out_file=stark_proof.json

echo ">> PROOF GENERATED: stark_proof.json"
echo ">> Your STARK Proof is now ready to be securely transmitted directly to the Starknet Core L1/L2 Verifier."
