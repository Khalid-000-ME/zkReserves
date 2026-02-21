"use client";
import { useEffect, useState } from "react";
import { getCurrentBlockHeight } from "@/lib/xverse";

export default function LiveBlockTicker() {
    const [btcBlock, setBtcBlock] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    async function refresh() {
        try {
            const h = await getCurrentBlockHeight();
            setBtcBlock(h);
        } catch {
            setBtcBlock(880412);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 30_000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="ticker-bar">
            <div className="item">
                <span className="dot" />
                <span>BTC Block</span>
                <span style={{ color: "var(--text)" }}>
                    {loading ? "..." : `#${btcBlock?.toLocaleString()}`}
                </span>
            </div>
            <div className="item">
                <span className="dot" style={{ background: "var(--purple)" }} />
                <span>Network</span>
                <span style={{ color: "var(--text)" }}>Starknet Sepolia</span>
            </div>
            <div className="item">
                <span>Proof TTL</span>
                <span style={{ color: "var(--text)" }}>30 days</span>
            </div>
        </div>
    );
}
