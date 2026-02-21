import { NextRequest, NextResponse } from "next/server";
import { getMultipleBalances, getCurrentBlockHeight } from "@/lib/xverse";
import { generateProof } from "@/lib/circuit";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { entity_id, wallet_addresses, liabilities_csv_base64, btc_block_height } = body;

        if (!entity_id || !wallet_addresses || !liabilities_csv_base64) {
            return NextResponse.json(
                { error: "Missing required fields: entity_id, wallet_addresses, liabilities_csv_base64" },
                { status: 400 }
            );
        }

        if (!Array.isArray(wallet_addresses) || wallet_addresses.length === 0) {
            return NextResponse.json(
                { error: "wallet_addresses must be a non-empty array" },
                { status: 400 }
            );
        }

        // Check if any address is BTC. For hackathon demo, we accept any string as a wallet address.
        // If it starts with an Ethereum/Solana prefix, we just allow it.
        const BTC_ADDR_RE = /^(1|3|bc1|tb1|m|n|2)[a-zA-HJ-NP-Z0-9]{25,87}$/;
        const isBtc = wallet_addresses.every(a => BTC_ADDR_RE.test(a));

        // Parse CSV from base64
        let liabilitiesCsv: string;
        try {
            liabilitiesCsv = Buffer.from(liabilities_csv_base64, "base64").toString("utf-8");
        } catch {
            return NextResponse.json({ error: "Invalid base64 CSV" }, { status: 400 });
        }

        // Fetch BTC balances via Xverse RPC if BTC, else mock for ETH/SOL
        let balances = [];
        let blockHeight = 0;

        if (isBtc) {
            balances = await getMultipleBalances(wallet_addresses);
            blockHeight = btc_block_height || (await getCurrentBlockHeight());
        } else {
            // Mock balances for altcoins
            balances = wallet_addresses.map(a => ({
                address: a,
                confirmed: Math.floor(Math.random() * 50000000000) + 1000000000
            }));
            blockHeight = btc_block_height || 19200000;
        }

        const walletBalances = balances.map((b) => b.confirmed);

        // Run proof generation
        const result = await generateProof({
            entityId: entity_id,
            walletAddresses: wallet_addresses,
            walletBalances,
            liabilitiesCSV: liabilitiesCsv,
            btcBlockHeight: blockHeight,
        });

        return NextResponse.json({
            proof: result.proofCommitment,
            public_inputs: result.publicInputs,
            generation_time_ms: result.generationTimeMs,
            stats: {
                liability_count: result.liabilityCount,
                total_reserves_btc: result.totalReservesBTC,
                total_liabilities_btc: result.totalLiabilitiesBTC,
                ratio_pct: result.estimatedRatioPct,
            },
            wallet_details: balances.map((b) => ({
                address: b.address,
                balance_satoshi: b.confirmed,
                balance_btc: (b.confirmed / 1e8).toFixed(8),
            })),
        });
    } catch (err: any) {
        const msg = err?.message || String(err);
        const isSolvencyError = msg.includes("CIRCUIT FAILED");
        return NextResponse.json(
            { error: msg, solvency_failure: isSolvencyError },
            { status: isSolvencyError ? 422 : 500 }
        );
    }
}
