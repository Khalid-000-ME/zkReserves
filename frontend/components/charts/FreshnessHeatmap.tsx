"use client";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { bandLabel } from "@/lib/starknet";

interface DataPoint {
    date: string;
    band: number;
}

interface Props {
    data: DataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="card card-tight" style={{ minWidth: 140 }}>
                <div className="text-muted text-xs">{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2, color: "var(--green)" }}>
                    {bandLabel(payload[0].value)}
                </div>
            </div>
        );
    }
    return null;
};

export default function FreshnessHeatmap({ data }: Props) {
    if (data.length === 0) {
        return (
            <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p className="text-muted text-sm">No proof history</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={160}>
            <LineChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis
                    dataKey="date"
                    tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--mono)" }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    domain={[0, 3]}
                    ticks={[1, 2, 3]}
                    tickFormatter={(v) => (v === 1 ? "~100" : v === 2 ? "~110" : "120+")}
                    tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--mono)" }}
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                    type="stepAfter"
                    dataKey="band"
                    stroke="var(--green)"
                    strokeWidth={2}
                    dot={{ fill: "var(--green)", r: 3 }}
                    activeDot={{ r: 4, fill: "var(--green)" }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
