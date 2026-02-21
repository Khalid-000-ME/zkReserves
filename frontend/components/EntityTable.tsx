"use client";
import Link from "next/link";
import ProofStatusBadge from "./ProofStatusBadge";
import ReserveRatioBand from "./ReserveRatioBand";
import ProofCountdown from "./ProofCountdown";
import { formatRelativeTime } from "@/lib/starknet";

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
                <Link href="/prove" className="btn btn-primary btn-sm">
                    Register & Submit Proof
                </Link>
            </div>
        );
    }

    return (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Entity</th>
                            <th>Status</th>
                            <th>Reserve Band</th>
                            <th>BTC Block</th>
                            <th>Proven</th>
                            <th>Expires</th>
                            <th>Proofs</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entities.map((e) => (
                            <tr key={e.id} className="clickable">
                                <td>
                                    <Link
                                        href={`/entity/${e.id}`}
                                        style={{ color: "var(--text)", fontWeight: 500 }}
                                    >
                                        {e.name}
                                    </Link>
                                </td>
                                <td>
                                    <ProofStatusBadge status={e.status} />
                                </td>
                                <td>
                                    {e.status === "NeverProven" ? (
                                        <span className="text-muted">—</span>
                                    ) : (
                                        <ReserveRatioBand band={e.band} size="sm" />
                                    )}
                                </td>
                                <td>
                                    {e.status === "NeverProven" ? (
                                        <span className="text-muted">—</span>
                                    ) : (
                                        <span className="mono-sm text-muted">
                                            #{Number(e.blockHeight).toLocaleString()}
                                        </span>
                                    )}
                                </td>
                                <td>
                                    {e.status === "NeverProven" ? (
                                        <span className="text-muted">—</span>
                                    ) : (
                                        <span className="text-muted text-sm">
                                            {formatRelativeTime(e.proofTimestamp)}
                                        </span>
                                    )}
                                </td>
                                <td>
                                    {e.status === "NeverProven" ? (
                                        <span className="text-muted">—</span>
                                    ) : (
                                        <ProofCountdown expiryTimestamp={e.expiryTimestamp} />
                                    )}
                                </td>
                                <td>
                                    <span className="mono-sm text-muted">{e.submissionCount}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
