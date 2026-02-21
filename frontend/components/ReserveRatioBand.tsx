"use client";
import { bandLabel, bandColor } from "@/lib/starknet";

interface Props {
    band: number;
    size?: "sm" | "md";
}

export default function ReserveRatioBand({ band, size = "md" }: Props) {
    if (band === 0) {
        return (
            <span className="badge badge-red">
                <span>●</span> Insolvent
            </span>
        );
    }

    const label = bandLabel(band);
    const color = bandColor(band);
    const width = band === 1 ? 33 : band === 2 ? 66 : 100;

    if (size === "sm") {
        return (
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color }}>
                {label}
            </span>
        );
    }

    return (
        <div style={{ minWidth: 120 }}>
            <div className="flex items-center justify-between">
                <span style={{ fontSize: 12, color }}>{label}</span>
            </div>
            <div className="band-bar">
                <div
                    className="band-bar-fill"
                    style={{ width: `${width}%`, background: color }}
                />
            </div>
        </div>
    );
}
