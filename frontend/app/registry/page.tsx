"use client";
import { useEffect, useRef, useState } from "react";
import LiveBlockTicker from "@/components/LiveBlockTicker";
import EcosystemHealthBanner from "@/components/EcosystemHealthBanner";
import EntityTable from "@/components/EntityTable";
import type { EntityRow } from "@/components/EntityTable";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

const ProofTimeline = dynamic(() => import("@/components/charts/ProofTimeline"), { ssr: false });
const RatioDistribution = dynamic(() => import("@/components/charts/RatioDistribution"), { ssr: false });

import { REGISTRY_ADDRESS, provider, feltToHash } from "@/lib/starknet";

const DEMO_ENTITIES: EntityRow[] = [
    {
        id: "0xkraken",
        name: "Kraken",
        status: "Active",
        band: 3,
        blockHeight: BigInt(880412),
        proofTimestamp: BigInt(Math.floor(Date.now() / 1000) - 7200),
        expiryTimestamp: BigInt(Math.floor(Date.now() / 1000) + 2419200),
        submissionCount: 12,
    },
    {
        id: "0xnexo",
        name: "Nexo",
        status: "Active",
        band: 2,
        blockHeight: BigInt(880001),
        proofTimestamp: BigInt(Math.floor(Date.now() / 1000) - 86400),
        expiryTimestamp: BigInt(Math.floor(Date.now() / 1000) + 2246400),
        submissionCount: 8,
    },
    {
        id: "0xmaple",
        name: "Maple Finance",
        status: "Expiring",
        band: 3,
        blockHeight: BigInt(878500),
        proofTimestamp: BigInt(Math.floor(Date.now() / 1000) - 2246400),
        expiryTimestamp: BigInt(Math.floor(Date.now() / 1000) + 172800),
        submissionCount: 3,
    },
];

export default function RegistryPage() {
    const [entities, setEntities] = useState<EntityRow[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const fetchRef = useRef<(() => Promise<void>) | null>(null);

    useEffect(() => {
        fetch("/api/ecosystem/stats")
            .then((r) => r.json())
            .then((d) => { setStats(d); })
            .catch(() => { });

        async function callContract(entrypoint: string, calldata: string[] = []): Promise<string[]> {
            return provider.callContract({ contractAddress: REGISTRY_ADDRESS, entrypoint, calldata });
        }

        function feltToName(hexFelt: string): string {
            let hex = BigInt(hexFelt).toString(16);
            if (hex.length % 2 !== 0) hex = "0" + hex;
            let decoded = "";
            for (let j = 0; j < hex.length; j += 2) {
                const code = parseInt(hex.slice(j, j + 2), 16);
                if (code > 0) decoded += String.fromCharCode(code);
            }
            return decoded.trim() || "Unknown";
        }

        async function fetchLiveEntities() {
            try {
                if (!REGISTRY_ADDRESS || REGISTRY_ADDRESS === "0x0" || REGISTRY_ADDRESS === "") {
                    setEntities(DEMO_ENTITIES);
                    setLoading(false);
                    return;
                }
                const countRes = await callContract("get_entity_count");
                const count = Number(BigInt(countRes[0]));
                if (count === 0) { setEntities([]); setLoading(false); return; }

                const loaded: EntityRow[] = [];
                for (let i = 0; i < count; i++) {
                    try {
                        const idRes = await callContract("get_entity_id_at", [String(i)]);
                        const id = idRes[0];
                        const rec = await callContract("get_entity", [id]);
                        const nameStr = feltToName(rec[0]);
                        const prf = await callContract("get_proof_record", [id]);
                        const r_height = BigInt(prf[1]);
                        const r_band = Number(BigInt(prf[3]));
                        const r_timestamp = BigInt(prf[4]);
                        const r_is_valid = BigInt(prf[5]) !== 0n;
                        const r_expiry = BigInt(prf[6]);
                        const r_count = Number(BigInt(prf[7]));
                        const nowSec = BigInt(Math.floor(Date.now() / 1000));
                        const twoDays = BigInt(48 * 3600);
                        let status: "Active" | "Expired" | "NeverProven" | "Expiring" = "NeverProven";
                        if (!r_is_valid || r_timestamp === 0n) status = "NeverProven";
                        else if (r_expiry < nowSec) status = "Expired";
                        else if (r_expiry - nowSec < twoDays) status = "Expiring";
                        else status = "Active";

                        loaded.push({ id: feltToHash(id), name: nameStr, status, band: r_band, blockHeight: r_height, proofTimestamp: r_timestamp, expiryTimestamp: r_expiry, submissionCount: r_count });
                    } catch (err) {
                        console.error("Error fetching entity:", err);
                    }
                }
                loaded.sort((a, b) => Number(b.proofTimestamp) - Number(a.proofTimestamp));
                setEntities(loaded);
                setLoading(false);
            } catch (error) {
                console.error("Failed to load entities:", error);
                setEntities(DEMO_ENTITIES);
                setLoading(false);
            }
        }

        fetchRef.current = fetchLiveEntities;
        fetchLiveEntities();
        const interval = setInterval(fetchLiveEntities, 30_000);
        return () => clearInterval(interval);
    }, []);

    const valid = entities.filter((e) => e.status === "Active" || e.status === "Expiring").length;
    const expired = entities.filter((e) => e.status === "Expired").length;
    const never = entities.filter((e) => e.status === "NeverProven").length;

    return (
        <>
            <LiveBlockTicker />
            <div className="page">
                <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>
                                Proof of Reserves Registry
                            </h1>
                            <p className="text-muted mt-1">
                                Real-time solvency status for registered entities  ·  Starknet Sepolia
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={async () => {
                                    if (fetchRef.current) {
                                        setRefreshing(true);
                                        await fetchRef.current();
                                        setRefreshing(false);
                                    }
                                }}
                                disabled={refreshing}
                                title="Refresh from Starknet"
                            >
                                <ArrowPathIcon style={{ width: 14, height: 14 }} />
                                {refreshing ? <span className="spinner" style={{ width: 12, height: 12 }} /> : "Refresh"}
                            </button>
                            <Link href="/onboard" className="btn btn-primary btn-sm">
                                Register Exchange
                            </Link>
                        </div>
                    </div>

                    <EcosystemHealthBanner
                        total={entities.length}
                        valid={valid}
                        expired={expired}
                        neverProven={never}
                        nextExpiryDays={2}
                    />

                    <div className="stats-row mt-4">
                        <div className="stat-cell">
                            <div className="stat-label">Total Proofs</div>
                            <div className="stat-value">{stats?.total_proofs_submitted_all_time ?? "—"}</div>
                        </div>
                        <div className="stat-cell">
                            <div className="stat-label">Avg Reserve Band</div>
                            <div className="stat-value">≥ 120%</div>
                        </div>
                        <div className="stat-cell">
                            <div className="stat-label">Entities Registered</div>
                            <div className="stat-value">{loading ? "—" : entities.length}</div>
                        </div>
                        <div className="stat-cell">
                            <div className="stat-label">Validity Rate</div>
                            <div className="stat-value" style={{ color: "var(--green)" }}>
                                {entities.length > 0 ? Math.round((valid / entities.length) * 100) : 0}%
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="section-header">
                            <div className="section-title">Registered Entities</div>
                            <div className="section-desc">Click any row to view proof history</div>
                        </div>
                        <EntityTable entities={entities} loading={loading} />
                    </div>

                    <div className="grid-2 mt-6" style={{ gap: 16 }}>
                        <div className="card">
                            <div className="section-header">
                                <div className="section-title">Proof Submissions</div>
                                <div className="section-desc">Last 5 weeks</div>
                            </div>
                            <ProofTimeline data={stats?.proof_history_30d ?? []} />
                        </div>
                        <div className="card">
                            <div className="section-header">
                                <div className="section-title">Reserve Band Distribution</div>
                                <div className="section-desc">Active proofs only</div>
                            </div>
                            <RatioDistribution data={stats?.band_distribution ?? [{ band: 1, count: 1 }, { band: 2, count: 2 }, { band: 3, count: 3 }]} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
