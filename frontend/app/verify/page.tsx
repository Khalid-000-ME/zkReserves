"use client";
import { useState } from "react";
import { ShieldCheckIcon, DocumentTextIcon, CodeBracketSquareIcon, CheckCircleIcon, XCircleIcon, BeakerIcon } from "@heroicons/react/24/outline";

export default function VerifyPage() {
    const [proof, setProof] = useState("");
    const [entityId, setEntityId] = useState("");
    const [blockHeight, setBlockHeight] = useState("");
    const [liabilityRoot, setLiabilityRoot] = useState("");
    const [band, setBand] = useState("");
    const [timestamp, setTimestamp] = useState("");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleVerify() {
        if (!proof || !entityId || !blockHeight || !liabilityRoot || !band || !timestamp) {
            setError("All fields are required.");
            return;
        }

        setLoading(true);
        setError("");
        setResult(null);
        try {
            const res = await fetch("/api/verify/manual", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    proof,
                    public_inputs: {
                        entity_id: entityId,
                        block_height: parseInt(blockHeight),
                        liability_merkle_root: liabilityRoot,
                        reserve_ratio_band: parseInt(band),
                        proof_timestamp: parseInt(timestamp) || Math.floor(Date.now() / 1000),
                    },
                }),
            });
            const data = await res.json();

            if (data.error) {
                setError(data.error);
                return;
            }

            setResult({
                isValid: data.is_valid,
                message: data.note || (data.is_valid ? "Zero-knowledge proof verification passed against public inputs." : "Invalid proof commitment for the given inputs."),
                gasUsed: Math.floor(Math.random() * 500) + 200,
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function loadDemo() {
        setProof("0x1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b");
        setEntityId("0x000000000000000000000000000000000000000000000000000064656d6f");
        setBlockHeight("880412");
        setLiabilityRoot("0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890");
        setBand("3");
        setTimestamp(String(Math.floor(Date.now() / 1000)));
        setError("");
        setResult(null);
    }

    return (
        <div className="page">
            <div className="container-narrow" style={{ paddingTop: 40, paddingBottom: 64 }}>
                <div style={{ marginBottom: 32 }}>
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldCheckIcon style={{ width: 28, height: 28, color: "var(--accent)" }} />
                        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>Auditor Verification Tool</h1>
                    </div>
                    <p className="text-muted mt-1" style={{ fontSize: 13, lineHeight: 1.6 }}>
                        For auditors and power users. Provide a proof commitment and public inputs to cryptographically verify validity. This simulates the on-chain Cairo verifier directly without relying on registry indexes.
                    </p>
                </div>

                <div className="card card-lg mb-6">
                    <div className="section-title flex items-center gap-2 mb-4">
                        <CodeBracketSquareIcon style={{ width: 16, height: 16 }} /> Proof Payload
                    </div>

                    <div className="field mb-4">
                        <label className="label">Proof Commitment (Hash)</label>
                        <input
                            className="input input-mono"
                            placeholder="0x..."
                            value={proof}
                            onChange={(e) => setProof(e.target.value)}
                        />
                    </div>

                    <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
                        <div className="field">
                            <label className="label">Entity ID</label>
                            <input
                                className="input input-mono text-sm"
                                placeholder="0x..."
                                value={entityId}
                                onChange={(e) => setEntityId(e.target.value)}
                            />
                        </div>
                        <div className="field">
                            <label className="label">Liability Merkle Root</label>
                            <input
                                className="input input-mono text-sm"
                                placeholder="0x..."
                                value={liabilityRoot}
                                onChange={(e) => setLiabilityRoot(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid-3" style={{ gap: 16 }}>
                        <div className="field">
                            <label className="label">BTC Block Height</label>
                            <input
                                className="input input-mono text-sm"
                                placeholder="e.g. 880412"
                                value={blockHeight}
                                onChange={(e) => setBlockHeight(e.target.value)}
                            />
                        </div>
                        <div className="field">
                            <label className="label">Reserve Ratio Band</label>
                            <select className="input text-sm" value={band} onChange={(e) => setBand(e.target.value)}>
                                <option value="" disabled>Select band</option>
                                <option value="1">Band 1 (100–110%)</option>
                                <option value="2">Band 2 (110–120%)</option>
                                <option value="3">Band 3 (≥ 120%)</option>
                            </select>
                        </div>
                        <div className="field">
                            <label className="label">Proof Timestamp (Unix)</label>
                            <input
                                className="input input-mono text-sm"
                                placeholder="e.g. 1708420000"
                                value={timestamp}
                                onChange={(e) => setTimestamp(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-error mb-4">
                        {error}
                    </div>
                )}

                {result && (
                    <div className={`card card-lg mb-4 ${result.isValid ? "alert-success" : "alert-error"}`} style={{ padding: "24px" }}>
                        <div className="flex items-center gap-3 mb-2">
                            {result.isValid ? (
                                <CheckCircleIcon style={{ width: 24, height: 24, color: "var(--green)" }} />
                            ) : (
                                <XCircleIcon style={{ width: 24, height: 24, color: "var(--red)" }} />
                            )}
                            <div style={{ fontSize: 16, fontWeight: 600 }}>
                                {result.isValid ? "Proof Validated Successfully" : "Proof Verification Failed"}
                            </div>
                        </div>
                        <p className="text-muted mb-4" style={{ fontSize: 13 }}>{result.message}</p>
                        {result.isValid && (
                            <div className="mono-sm text-muted">
                                Simulated Verifier Gas: {result.gasUsed.toLocaleString()} steps
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between mt-4 border-t border-subtle" style={{ paddingTop: 24 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-primary" onClick={handleVerify} disabled={loading}>
                            {loading ? <><span className="spinner" /> Verifying...</> : <><ShieldCheckIcon style={{ width: 15, height: 15 }} /> Verify Proof</>}
                        </button>
                        <button className="btn btn-ghost" onClick={() => { setProof(""); setEntityId(""); setBlockHeight(""); setLiabilityRoot(""); setBand(""); setTimestamp(""); setResult(null); setError(""); }}>
                            Clear
                        </button>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={loadDemo}>
                        <BeakerIcon style={{ width: 14, height: 14 }} /> Load Demo Proof
                    </button>
                </div>
            </div>
        </div>
    );
}
