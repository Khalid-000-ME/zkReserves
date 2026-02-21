const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const LOCAL_CIRCUIT = path.join(__dirname, '..', 'circuit');
const DOCKER_CIRCUIT = path.join(__dirname, 'circuit'); // When server.js is copied to /app/server.js
const CIRCUIT_DIR = fs.existsSync(DOCKER_CIRCUIT) ? DOCKER_CIRCUIT : LOCAL_CIRCUIT;

// Scarb 2.12.2 binary path
const SCARB_LOCAL = '/Users/khalid/.asdf/installs/scarb/2.12.2/bin/scarb';
const SCARB_DOCKER = '/usr/local/bin/scarb';
const SCARB_BIN = fs.existsSync(SCARB_LOCAL)
    ? SCARB_LOCAL
    : (fs.existsSync(SCARB_DOCKER) ? SCARB_DOCKER : 'scarb');

// ─── Async child process runner (no deadlock) ───────────────────────────────

/**
 * Run a shell command asynchronously, streaming stdout/stderr to console.
 * Returns a Promise that resolves with stdout string or rejects on non-zero exit.
 */
function run(bin, args) {
    return new Promise((resolve, reject) => {
        const cmdLog = `${bin} ${args.join(' ')}`;
        console.log(`  $ ${cmdLog}`);
        const child = spawn(bin, args, {
            cwd: CIRCUIT_DIR,
            env: process.env,
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (d) => {
            const s = d.toString();
            stdout += s;
            process.stdout.write(s);
        });

        child.stderr.on('data', (d) => {
            const s = d.toString();
            stderr += s;
            process.stdout.write(s); // scarb writes progress to stderr
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve(stdout.trim());
            } else {
                const err = new Error(stderr.trim() || `Command failed (exit ${code}): ${cmdLog}`);
                err.stderr = stderr;
                reject(err);
            }
        });

        child.on('error', reject);
    });
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function sumToSats(balances) {
    return (balances || []).reduce((acc, b) => acc + Math.round(Number(b) * 1e8), 0);
}

function parseLiabilitiesCSV(csv) {
    const lines = (csv || '').split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#'));
    let total = 0;
    for (const line of lines) {
        const parts = line.split(',');
        const val = parseFloat(parts[1] || '0');
        if (!isNaN(val)) {
            total += Math.round(val * 1e8);
        }
    }
    return total;
}

function findLatestExecutionId() {
    const baseDir = path.join(CIRCUIT_DIR, 'target', 'execute', 'zkreserves_circuit');
    if (!fs.existsSync(baseDir)) return null;
    const ids = fs.readdirSync(baseDir)
        .filter(d => d.startsWith('execution'))
        .map(d => parseInt(d.replace('execution', ''), 10))
        .filter(n => !isNaN(n));
    return ids.length > 0 ? Math.max(...ids) : null;
}

function findProofFile(execId) {
    const p = path.join(
        CIRCUIT_DIR, 'target', 'execute', 'zkreserves_circuit',
        `execution${execId}`, 'proof', 'proof.json'
    );
    return fs.existsSync(p) ? p : null;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.post('/api/prove', async (req, res) => {
    try {
        const { entityId, walletBalances, liabilitiesCSV } = req.body;
        console.log(`\n📡 [PROVE] Entity: ${entityId}`);

        const reservesSats = sumToSats(walletBalances);
        const liabilitiesSats = parseLiabilitiesCSV(liabilitiesCSV);

        if (liabilitiesSats <= 0) return res.status(400).json({ error: 'No valid liabilities in CSV' });
        if (reservesSats < liabilitiesSats) {
            return res.status(400).json({
                error: 'Entity is insolvent: reserves < liabilities. No proof is possible.'
            });
        }

        console.log(`   Reserves:    ${reservesSats} sats`);
        console.log(`   Liabilities: ${liabilitiesSats} sats`);
        console.log(`   Ratio:       ${(reservesSats / liabilitiesSats * 100).toFixed(1)}%`);

        // 1. Execute
        console.log('🏃 scarb execute...');
        await run(SCARB_BIN, [
            'execute',
            '--executable-name', 'zkreserves',
            '--arguments', `${reservesSats},${liabilitiesSats}`,
            '--output', 'standard'
        ]);

        const execId = findLatestExecutionId();
        if (!execId) throw new Error('Could not find execution output after scarb execute');
        console.log(`   Execution ID: ${execId}`);

        // 2. Prove
        console.log('🔐 scarb prove (Stwo STARK)...');
        await run(SCARB_BIN, ['prove', '--execution-id', execId.toString()]);

        // 3. Read proof
        const proofPath = findProofFile(execId);
        if (!proofPath) throw new Error('Proof file not found after scarb prove');

        const proofJson = fs.readFileSync(proofPath, 'utf8');
        const commitment = '0x' + crypto.createHash('sha256').update(proofJson).digest('hex');

        const ratioPct = Math.floor(reservesSats * 100 / liabilitiesSats);
        const band = ratioPct < 110 ? 1 : ratioPct < 120 ? 2 : 3;

        console.log(`✅ Proof done — band: ${band}, commitment: ${commitment.slice(0, 18)}...`);
        res.json({
            success: true,
            message: 'True ZK STARK proof generated via Stwo.',
            proofData: { executionId: execId, commitment, band, reserveRatioPct: ratioPct, starkProofBytecode: proofJson }
        });

    } catch (err) {
        const msg = (err.stderr || err.message || '').toString();
        console.error('❌ [PROVE]', msg.slice(0, 500));
        res.status(500).json({ error: msg });
    }
});

app.post('/api/verify', async (req, res) => {
    try {
        const { entityId, starkProofBytecode, executionId } = req.body;
        console.log(`\n📡 [VERIFY] Entity: ${entityId}`);

        let verified = false;
        let message = '';

        try {
            if (executionId) {
                await run(SCARB_BIN, ['verify', '--execution-id', executionId.toString()]);
            } else {
                // Write proof to temp file, verify, clean up
                const tmpFile = `verify_${Date.now()}.json`;
                const tmpPath = path.join(CIRCUIT_DIR, tmpFile);
                fs.writeFileSync(tmpPath, starkProofBytecode);
                try {
                    await run(SCARB_BIN, ['verify', '--proof-file', tmpFile]);
                } finally {
                    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
                }
            }
            verified = true;
            message = 'STARK proof verified by native Stwo verifier.';
        } catch (verifyErr) {
            throw verifyErr;
        }

        console.log(verified ? '✅ Verified' : '❌ Verification failed');
        res.json({ success: true, verified, message });

    } catch (err) {
        const msg = (err.stderr || err.message || '').toString();
        console.error('❌ [VERIFY]', msg.slice(0, 500));
        res.status(500).json({ error: msg, verified: false });
    }
});

app.get('/health', (_, res) => res.json({
    status: 'ok',
    pipeline: 'scarb-stwo-native',
    scarbBin: SCARB_BIN,
}));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`\n🚀 zkReserves Prover API — port ${PORT}`);
    console.log(`   Scarb: ${SCARB_BIN}`);
    console.log('   Pipeline: scarb execute → scarb prove → scarb verify\n');
});
