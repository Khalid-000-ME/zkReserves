"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount } from "@starknet-react/core";
import {
    ShieldCheckIcon,
    ClockIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    ChartBarIcon,
    ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { provider, REGISTRY_ADDRESS, feltToHash } from "@/lib/starknet";
import dynamic from "next/dynamic";

const ProofTimeline = dynamic(() => import("@/components/charts/ProofTimeline"), { ssr: false });

// ── helpers ────────────────────────────────────────────────────────────────────
function feltToName(hex: string): string {
    let h = BigInt(hex).toString(16);
    if (h.length % 2) h = "0" + h;
    let s = "";
    for (let i = 0; i < h.length; i += 2) {
        const c = parseInt(h.slice(i, i + 2), 16);
        if (c > 0) s += String.fromCharCode(c);
    }
    return s.trim() || "Unknown";
}

function formatTimestamp(ts: bigint): string {
    if (ts === 0n) return "—";
    return new Date(Number(ts) * 1000).toLocaleString();
}

function daysUntil(ts: bigint): number {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const diff = Number(ts - now);
    return Math.max(0, Math.floor(diff / 86400));
}

function hoursUntil(ts: bigint): number {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const diff = Number(ts - now);
    return Math.max(0, Math.floor(diff / 3600));
}

interface EntityData {
    id: string;
    name: string;
    status: "Active" | "Expiring" | "Expired" | "NeverProven";
    band: number;
    blockHeight: bigint;
    proofTimestamp: bigint;
    expiryTimestamp: bigint;
    submissionCount: number;
}

// ── component ──────────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const { address, isConnected } = useAccount();
    const [entity, setEntity] = useState<EntityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [notFound, setNotFound] = useState(false);

    async function callContract(entrypoint: string, calldata: string[] = []): Promise<string[]> {
        return provider.callContract({ contractAddress: REGISTRY_ADDRESS, entrypoint, calldata });
    }

    async function loadEntityForWallet(addr: string) {
        setLoading(true);
        setNotFound(false);
        try {
            const countRes = await callContract("get_entity_count");
            const count = Number(BigInt(countRes[0]));
            for (let i = 0; i < count; i++) {
                const idRes = await callContract("get_entity_id_at", [String(i)]);
                const id = idRes[0];
                const rec = await callContract("get_entity", [id]);
                // rec[2] is the registrant address
                if (rec[2]?.toLowerCase() === addr.toLowerCase() || feltToHash(rec[2]) === feltToHash(addr)) {
                    const prf = await callContract("get_proof_record", [id]);
                    const r_height = BigInt(prf[1]);
                    const r_band = Number(BigInt(prf[3]));
                    const r_timestamp = BigInt(prf[4]);
                    const r_is_valid = BigInt(prf[5]) !== 0n;
                    const r_expiry = BigInt(prf[6]);
                    const r_count = Number(BigInt(prf[7]));
                    const nowSec = BigInt(Math.floor(Date.now() / 1000));
                    let status: EntityData["status"] = "NeverProven";
                    if (!r_is_valid || r_timestamp === 0n) status = "NeverProven";
                    else if (r_expiry < nowSec) status = "Expired";
                    else if (r_expiry - nowSec < BigInt(72 * 3600)) status = "Expiring";
                    else status = "Active";
                    setEntity({ id: feltToHash(id), name: feltToName(rec[0]), status, band: r_band, blockHeight: r_height, proofTimestamp: r_timestamp, expiryTimestamp: r_expiry, submissionCount: r_count });
                    setLoading(false);
                    return;
                }
            }
            setNotFound(true);
        } catch (e) {
            console.error(e);
            setNotFound(true);
        }
        setLoading(false);
    }

    useEffect(() => {
        if (address) loadEntityForWallet(address);
        else setLoading(false);
    }, [address]);

    const StatusIcon = () => {
        if (!entity) return null;
        if (entity.status === "Active") return <ShieldCheckIcon style={{ width: 20, height: 20, color: "var(--green)" }} />;
        if (entity.status === "Expiring") return <ExclamationTriangleIcon style={{ width: 20, height: 20, color: "var(--yellow)" }} />;
        return <XCircleIcon style={{ width: 20, height: 20, color: "var(--red)" }} />;
    };

    const bandLabel = (b: number) => ["—", "100–110%", "110–120%", "≥ 120%"][b] || "—";
    const bandColor = (b: number) => b >= 3 ? "var(--green)" : b === 2 ? "var(--green)" : b === 1 ? "var(--yellow)" : "var(--text-muted)";

    // ── not connected ──────────────────────────────────────────────────────────
    if (!isConnected) {
        return (
            <div className="page">
                <div className="container-narrow" style={{ paddingTop: 80, paddingBottom: 48 }}>
                    <div className="card card-lg" style={{ textAlign: "center", padding: "64px 40px" }}>
                        <ShieldCheckIcon style={{ width: 40, height: 40, color: "var(--text-dim)", margin: "0 auto 20px" }} />
                        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Operator Dashboard</h1>
                        <p className="text-muted" style={{ marginBottom: 28, maxWidth: 340, margin: "0 auto 28px" }}>
                            Connect your Braavos wallet to view your entity&apos;s live solvency status and proof history.
                        </p>
                        <Link href="/onboard" className="btn btn-primary">
                            Connect and Register
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ── loading ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="page">
                <div className="container" style={{ paddingTop: 48 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-muted)", fontSize: 13 }}>
                        <span className="spinner" /> Looking up entity for connected wallet...
                    </div>
                </div>
            </div>
        );
    }

    // ── not registered ─────────────────────────────────────────────────────────
    if (notFound || !entity) {
        return (
            <div className="page">
                <div className="container-narrow" style={{ paddingTop: 80, paddingBottom: 48 }}>
                    <div className="card card-lg" style={{ textAlign: "center", padding: "64px 40px" }}>
                        <ChartBarIcon style={{ width: 40, height: 40, color: "var(--text-dim)", margin: "0 auto 20px" }} />
                        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No entity found</h1>
                        <p className="text-muted" style={{ marginBottom: 28, maxWidth: 380, margin: "0 auto 28px" }}>
                            No entity is registered for this wallet address. Register your exchange to start submitting proofs.
                        </p>
                        <Link href="/onboard" className="btn btn-primary">
                            Register Your Exchange
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const days = daysUntil(entity.expiryTimestamp);
    const hours = hoursUntil(entity.expiryTimestamp);
    const expiryUrgent = entity.status === "Expiring" || entity.status === "Expired";

    return (
        <div className="page">
            <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>Operator Dashboard</h1>
                        <p className="text-muted mt-1" style={{ fontFamily: "var(--mono)", fontSize: 11 }}>
                            {entity.id.slice(0, 24)}...
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={async () => { setRefreshing(true); await loadEntityForWallet(address!); setRefreshing(false); }}
                            disabled={refreshing}
                        >
                            <ArrowPathIcon style={{ width: 14, height: 14 }} />
                            {refreshing ? <span className="spinner" style={{ width: 12, height: 12 }} /> : "Refresh"}
                        </button>
                        <Link href="/prove" className="btn btn-primary btn-sm">
                            {entity.status === "NeverProven" ? "Submit First Proof" : "Renew Proof"}
                        </Link>
                    </div>
                </div>

                {/* ── Expiry Alert ─────────────────────────────────────────── */}
                {expiryUrgent && (
                    <div className={`alert ${entity.status === "Expired" ? "alert-error" : "alert-warning"} mb-4`}>
                        {entity.status === "Expired" ? (
                            <XCircleIcon style={{ width: 16, height: 16, flexShrink: 0 }} />
                        ) : (
                            <ExclamationTriangleIcon style={{ width: 16, height: 16, flexShrink: 0 }} />
                        )}
                        <div>
                            <strong>{entity.status === "Expired" ? "Proof expired" : `Expires in ${days > 0 ? `${days}d` : `${hours}h`}`}</strong>
                            {" — "}
                            {entity.status === "Expired"
                                ? "Your entity is publicly marked as expired. Renew immediately to restore Active status."
                                : "Renew before expiry to avoid your entity being marked expired on the public registry."}
                            {" "}
                            <Link href="/prove" style={{ textDecoration: "underline", fontWeight: 600 }}>Renew now</Link>
                        </div>
                    </div>
                )}

                {/* ── Status Cards Row ─────────────────────────────────────── */}
                <div className="stats-row">
                    <div className="stat-cell">
                        <div className="stat-label">Entity Name</div>
                        <div className="stat-value" style={{ fontSize: 18 }}>{entity.name}</div>
                    </div>
                    <div className="stat-cell">
                        <div className="stat-label">Status</div>
                        <div className="stat-value" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 18 }}>
                            <StatusIcon />
                            {entity.status}
                        </div>
                    </div>
                    <div className="stat-cell">
                        <div className="stat-label">Reserve Band</div>
                        <div className="stat-value" style={{ color: bandColor(entity.band), fontSize: 18 }}>
                            {bandLabel(entity.band)}
                        </div>
                    </div>
                    <div className="stat-cell">
                        <div className="stat-label">Proofs Submitted</div>
                        <div className="stat-value" style={{ fontSize: 18 }}>{entity.submissionCount}</div>
                    </div>
                </div>

                {/* ── Expiry Countdown ─────────────────────────────────────── */}
                <div className="card mt-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ClockIcon style={{ width: 18, height: 18, color: expiryUrgent ? "var(--yellow)" : "var(--text-muted)" }} />
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>Proof Validity Window</div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                                    Last proven: {formatTimestamp(entity.proofTimestamp)}
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{
                                fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em",
                                color: entity.status === "Expired" ? "var(--red)" : entity.status === "Expiring" ? "var(--yellow)" : "var(--green)",
                            }}>
                                {entity.status === "Expired" ? "Expired" : entity.status === "NeverProven" ? "No proof" : `${days}d ${hours % 24}h remaining`}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                                Expires: {formatTimestamp(entity.expiryTimestamp)}
                            </div>
                        </div>
                    </div>
                    {/* Progress bar */}
                    {entity.status !== "NeverProven" && entity.proofTimestamp !== 0n && (
                        <div style={{ marginTop: 16 }}>
                            <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                                <div style={{
                                    height: "100%", borderRadius: 2,
                                    width: `${Math.max(0, Math.min(100, (days / 28) * 100))}%`,
                                    background: entity.status === "Expired" ? "var(--red)" : entity.status === "Expiring" ? "var(--yellow)" : "var(--green)",
                                    transition: "width 0.5s",
                                }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                                <span style={{ fontSize: 10, color: "var(--text-dim)", fontFamily: "var(--mono)" }}>Proof submitted</span>
                                <span style={{ fontSize: 10, color: "var(--text-dim)", fontFamily: "var(--mono)" }}>28d expiry</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Proof Details ─────────────────────────────────────────── */}
                <div className="grid-2 mt-4" style={{ gap: 16 }}>
                    <div className="card">
                        <div className="section-title mb-4">Last Proof Details</div>
                        {[
                            { label: "BTC Block Height", value: entity.blockHeight > 0n ? `#${entity.blockHeight.toLocaleString()}` : "—" },
                            { label: "Reserve Band", value: bandLabel(entity.band) },
                            { label: "Proof Timestamp", value: formatTimestamp(entity.proofTimestamp) },
                            { label: "Submission Count", value: entity.submissionCount },
                        ].map((row) => (
                            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{row.label}</span>
                                <span style={{ fontSize: 12, fontFamily: "var(--mono)", fontWeight: 500 }}>{String(row.value)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="card">
                        <div className="section-title mb-4">Actions</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <Link href="/prove" className="btn btn-primary" style={{ justifyContent: "flex-start" }}>
                                <ArrowPathIcon style={{ width: 16, height: 16 }} />
                                {entity.status === "NeverProven" ? "Submit First Proof" : "Renew Proof"}
                            </Link>
                            <Link href={`/entity/${entity.id}`} className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
                                <ArrowTopRightOnSquareIcon style={{ width: 16, height: 16 }} />
                                View Public Profile
                            </Link>
                            <Link href="/registry" className="btn btn-ghost" style={{ justifyContent: "flex-start" }}>
                                <ChartBarIcon style={{ width: 16, height: 16 }} />
                                Browse Full Registry
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
