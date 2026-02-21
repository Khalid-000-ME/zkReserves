"use client";
import React, { useState } from "react";
import Link from "next/link";
import ProofStatusBadge from "./ProofStatusBadge";
import ReserveRatioBand from "./ReserveRatioBand";
import ProofCountdown from "./ProofCountdown";
import { formatRelativeTime } from "@/lib/starknet";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

export interface EntityRow {
    id: string;
    name: string;
    status: "Active" | "Expired" | "NeverProven" | "Expiring";
    band: number;
    blockHeight: bigint | number;
    proofTimestamp: bigint | number;
    expiryTimestamp: bigint | number;
    submissionCount: number;
}

interface Props {
    entities: EntityRow[];
    loading?: boolean;
}

export default function EntityTable({ entities, loading }: Props) {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    if (loading) {
        return (
            <div className="card">
                <div style={{ padding: "32px", textAlign: "center" }}>
                    <div className="spinner" style={{ margin: "0 auto 12px" }} />
                    <p className="text-muted text-sm">Loading entities from Starknet...</p>
                </div>
            </div>
        );
    }

    if (entities.length === 0) {
        return (
            <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
                    No entities registered yet.
                </p>
                <Link href="/onboard" className="btn btn-primary btn-sm">
                    Register & Submit Proof
                </Link>
            </div>
        );
    }

    // Group entities by parent name if they use the "Name|Token |Network" standard encoding
    const groups: Record<string, { parent: string, activeProofs: number, bands: Record<number, number>, children: EntityRow[] }> = {};

    entities.forEach(e => {
        const parts = e.name.split("|");
        const parentName = parts[0];

        if (!groups[parentName]) {
            groups[parentName] = { parent: parentName, activeProofs: 0, bands: {}, children: [] };
        }
        groups[parentName].children.push(e);
        if (e.status === "Active" || e.status === "Expiring") {
            groups[parentName].activeProofs++;
            groups[parentName].bands[e.band] = (groups[parentName].bands[e.band] || 0) + 1;
        }
    });

    const toggleExpand = (parent: string) => {
        setExpanded(p => ({ ...p, [parent]: !p[parent] }));
    };

    return (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Entity Name</th>
                            <th>Status (Aggregated)</th>
                            <th>Proof Details</th>
                            <th>Assets Covered</th>
                            <th>Total Proofs Submitted</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.values(groups).map((g) => {
                            const isExpanded = expanded[g.parent];
                            const hasMultiple = g.children.length > 1;

                            // Aggregation logic
                            const activeKids = g.children.filter(c => c.status === "Active" || c.status === "Expiring");
                            let aggStatus: "Active" | "Expired" | "NeverProven" | "Expiring" = "NeverProven";
                            if (activeKids.length === g.children.length) aggStatus = "Active";
                            else if (activeKids.length > 0) aggStatus = "Expiring"; // Partial
                            else if (g.children.some(c => c.status === "Expired")) aggStatus = "Expired";

                            const totalSubmits = g.children.reduce((acc, c) => acc + c.submissionCount, 0);

                            // Band breakdown string
                            const bandStrings = [];
                            if (g.bands[3]) bandStrings.push(`Band 3 in ${g.bands[3]} cases`);
                            if (g.bands[2]) bandStrings.push(`Band 2 in ${g.bands[2]} cases`);
                            if (g.bands[1]) bandStrings.push(`Band 1 in ${g.bands[1]} cases`);
                            const bandSummary = bandStrings.length ? bandStrings.join(", ") : "No active proofs";

                            return (
                                <React.Fragment key={g.parent}>
                                    {/* Parent Group Row */}
                                    <tr onClick={() => hasMultiple && toggleExpand(g.parent)} className={hasMultiple ? "clickable" : ""} style={{ background: hasMultiple ? "var(--surface-2)" : "transparent" }}>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                {hasMultiple && (
                                                    isExpanded ? <ChevronUpIcon style={{ width: 14, height: 14, color: "var(--text-muted)" }} /> : <ChevronDownIcon style={{ width: 14, height: 14, color: "var(--text-muted)" }} />
                                                )}
                                                <span style={{ fontWeight: 600, color: "var(--text)" }}>{g.parent}</span>
                                            </div>
                                        </td>
                                        <td><ProofStatusBadge status={aggStatus} /></td>
                                        <td><span className="text-muted text-sm">{bandSummary}</span></td>
                                        <td><span className="mono-sm text-dim">{g.children.length} {g.children.length === 1 ? 'asset' : 'assets'}</span></td>
                                        <td><span className="mono-sm text-muted">{totalSubmits}</span></td>
                                    </tr>

                                    {/* Token-Specific Child Rows (Only show if multiple and expanded, OR if just one child then show immediately but offset) */}
                                    {(isExpanded || !hasMultiple) && g.children.map(c => {
                                        const parts = c.name.split("|");
                                        const tokenName = parts[1] || "BTC";
                                        const networkName = parts[2] || "Bitcoin";

                                        return (
                                            <tr key={c.id} style={{ background: hasMultiple ? "rgba(0,0,0,0.2)" : "transparent" }}>
                                                <td style={{ paddingLeft: hasMultiple ? 32 : 16 }}>
                                                    <Link href={`/entity/${c.id}`} style={{ display: "flex", flexDirection: "column", textDecoration: "none" }}>
                                                        <span style={{ color: "var(--green)", fontWeight: 500, fontSize: 13 }}>{tokenName}</span>
                                                        <span style={{ color: "var(--text-dim)", fontSize: 11 }}>{networkName}</span>
                                                    </Link>
                                                </td>
                                                <td><ProofStatusBadge status={c.status} /></td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        {c.status === "NeverProven" ? <span className="text-muted">—</span> : <ReserveRatioBand band={c.band} size="sm" />}
                                                        <span className="mono-sm text-dim">Block #{Number(c.blockHeight).toLocaleString()}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    {c.status === "NeverProven" ? <span className="text-muted">—</span> : <span className="text-muted text-sm px-2">Proven {formatRelativeTime(c.proofTimestamp)}</span>}
                                                </td>
                                                <td>
                                                    {c.status === "NeverProven" ? <span className="text-muted">—</span> : <ProofCountdown expiryTimestamp={c.expiryTimestamp} />}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
