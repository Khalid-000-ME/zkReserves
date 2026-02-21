"use client";
import { useEffect, useState } from "react";
import { daysUntilExpiry } from "@/lib/starknet";

interface Props {
    expiryTimestamp: bigint | number;
}

export default function ProofCountdown({ expiryTimestamp }: Props) {
    const [days, setDays] = useState(() => daysUntilExpiry(expiryTimestamp));

    useEffect(() => {
        const interval = setInterval(() => {
            setDays(daysUntilExpiry(expiryTimestamp));
        }, 60_000);
        return () => clearInterval(interval);
    }, [expiryTimestamp]);

    if (days === 0) {
        return <span style={{ color: "var(--red)", fontSize: 12 }}>Expired</span>;
    }
    if (days <= 3) {
        return (
            <span style={{ color: "var(--yellow)", fontSize: 12 }}>
                {days}d remaining
            </span>
        );
    }
    return (
        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
            {days}d
        </span>
    );
}
