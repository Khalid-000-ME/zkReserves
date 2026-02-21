"use client";

interface Props {
    total: number;
    valid: number;
    expired: number;
    neverProven: number;
    lastProofTime?: number;
    nextExpiryDays?: number;
}

export default function EcosystemHealthBanner({
    total,
    valid,
    expired,
    neverProven,
    lastProofTime,
    nextExpiryDays,
}: Props) {
    const pct = total > 0 ? Math.round((valid / total) * 100) : 0;

    return (
        <div className="health-banner">
            <div>
                <div className="health-title">Ecosystem Health</div>
                <div className="flex items-center gap-2 mt-2">
                    <span className="health-metric" style={{ color: pct >= 75 ? "var(--green)" : pct >= 50 ? "var(--yellow)" : "var(--red)" }}>
                        {valid}/{total}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>entities with valid proof</span>
                </div>
            </div>

            <div className="health-bar" style={{ minWidth: 200 }}>
                <div className="flex justify-between mt-1 mb-1">
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Proven solvent</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--mono)" }}>{pct}%</span>
                </div>
                <div className="health-bar-track">
                    <div
                        className="health-bar-fill"
                        style={{
                            width: `${pct}%`,
                            background: pct >= 75 ? "var(--green)" : pct >= 50 ? "var(--yellow)" : "var(--red)",
                        }}
                    />
                </div>
            </div>

            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div>
                    <div className="stat-label">Valid</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "var(--green)" }}>{valid}</div>
                </div>
                <div>
                    <div className="stat-label">Expired</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "var(--red)" }}>{expired}</div>
                </div>
                <div>
                    <div className="stat-label">Never Proven</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-muted)" }}>{neverProven}</div>
                </div>
                {nextExpiryDays !== undefined && (
                    <div>
                        <div className="stat-label">Next Expiry</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: nextExpiryDays <= 3 ? "var(--yellow)" : "var(--text)" }}>
                            {nextExpiryDays}d
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
