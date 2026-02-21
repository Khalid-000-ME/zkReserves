"use client";
import { type ProofStatus } from "@/lib/starknet";

interface Props {
    status: ProofStatus | string;
}

export default function ProofStatusBadge({ status }: Props) {
    if (status === "Active") {
        return <span className="badge badge-green">✓ Active</span>;
    }
    if (status === "Expired") {
        return <span className="badge badge-red">✗ Expired</span>;
    }
    if (status === "NeverProven") {
        return <span className="badge badge-gray">— Never Proven</span>;
    }
    // Handle expiring soon
    if (status === "Expiring") {
        return <span className="badge badge-yellow">⚠ Expiring Soon</span>;
    }
    return <span className="badge badge-gray">{status}</span>;
}
