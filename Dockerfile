# ========================================================
# TRUE ZK PROVING ENVIRONMENT (RAILWAY READY)
# ========================================================
# This Dockerfile merges Node.js with the raw cryptographic 
# CPU execution engines built by StarkWare and compiled by DipDup.

# Base Node.js image
FROM node:20-bullseye-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    jq \
    bash \
    coreutils \
    && rm -rf /var/lib/apt/lists/*

# Install Starknet Scarb Compiler globally
RUN curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

# Install cairo1-run (needed to generate polynomial traces)
RUN curl -L https://github.com/lambdaclass/cairo1_run/releases/download/v0.3.0/cairo1-run-linux -o /usr/local/bin/cairo-run
RUN chmod +x /usr/local/bin/cairo-run

# Download the massive C++ STARK Prover and Verifier directly from DipDup open source releases (bypassing lambdaclass image bugs)
RUN curl -L https://github.com/dipdup-io/stone-packaging/releases/download/v3.0.3/cpu_air_prover-x86_64 -o /usr/local/bin/cpu_prover
RUN chmod +x /usr/local/bin/cpu_prover

RUN curl -L https://github.com/dipdup-io/stone-packaging/releases/download/v3.0.3/cpu_air_verifier-x86_64 -o /usr/local/bin/cpu_verifier
RUN chmod +x /usr/local/bin/cpu_verifier

# Setup Application working directory
WORKDIR /app/prover_api

# Copy API dependencies
COPY prover_api/package.json ./
RUN npm install

# Copy source repos so the API can reach into the circuit logic!
COPY prover_api/ ./
COPY circuit/ /app/circuit/

# Expose Railway Port
EXPOSE 8080

CMD ["node", "server.js"]
