# ========================================================
# TRUE ZK PROVING ENVIRONMENT (RAILWAY READY)
# ========================================================
# This Dockerfile merges Node.js with the raw cryptographic 
# CPU execution engines built by Lambdaclass and Starknet.
# We pull the actual `cpu_prover` STARK engine directly 
# from the LambdaClass container so we don't need Docker-in-Docker!

# Stage 1: Pluck the native C++ Prover directly from LambdaClass
FROM ghcr.io/lambdaclass/stone-prover:latest AS stone-prover-bin

# Stage 2: Build the core Node.js Execution API
FROM node:20-bullseye-slim

# Install system dependencies & Scarb
RUN apt-get update && apt-get install -y \
    curl \
    jq \
    bash \
    coreutils \
    && rm -rf /var/lib/apt/lists/*

# Install Starknet Scarb Compiler globally
RUN curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

# Install cairo1-run (needed to trace output files!)
RUN curl -L https://github.com/lambdaclass/cairo1_run/releases/download/v0.3.0/cairo1-run-linux -o /usr/local/bin/cairo-run
RUN chmod +x /usr/local/bin/cairo-run

# Pluck the massive monolithic Prover + Verifier from Stage 1!
COPY --from=stone-prover-bin /bin/cpu_prover /usr/local/bin/cpu_prover
COPY --from=stone-prover-bin /bin/cpu_verifier /usr/local/bin/cpu_verifier

# Setup Application working directory
WORKDIR /app/prover_api

# Copy API dependencies
COPY prover_api/package.json ./
RUN npm install

# Copy source repos so the API can reach into the circuit logic!
# (Notice we copy the /circuit folder so `scarb` has constraints to build)
COPY prover_api/ ./
COPY circuit/ /app/circuit/

# Expose Railway Port
EXPOSE 8080

CMD ["node", "server.js"]
