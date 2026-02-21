# zkReserves — Prover API
# Uses Scarb 2.12.2 for stable Stwo STARK prover/verifier.
# No Rust compilation, no Docker-in-Docker, no Python virtualenv needed.

FROM node:20-bullseye-slim

# Install curl (needed to download Scarb)
RUN apt-get update && apt-get install -y curl bash coreutils jq \
    && rm -rf /var/lib/apt/lists/*

# Install Scarb 2.12.2 (bundled with Stwo prover + scarb-execute + scarb-prove + scarb-verify)
ENV SCARB_VERSION=2.12.2
RUN curl -fsSL https://github.com/software-mansion/scarb/releases/download/v${SCARB_VERSION}/scarb-v${SCARB_VERSION}-x86_64-unknown-linux-gnu.tar.gz \
    | tar -xz -C /usr/local/bin --strip-components=2 scarb-v${SCARB_VERSION}-x86_64-unknown-linux-gnu/bin/

# Verify Scarb + Stwo tools are available
RUN scarb --version && scarb-prove --version && scarb-verify --version

WORKDIR /app

# Copy and install Node.js dependencies
COPY prover_api/package*.json ./
RUN npm ci --only=production

# Copy the Express server
COPY prover_api/server.js ./

# Copy the Cairo circuit (source + compiled targets)
COPY circuit/ ./circuit/

# Pre-build the circuit so the first request doesn't pay compilation overhead
RUN cd circuit && scarb build

EXPOSE 8080
CMD ["node", "server.js"]
