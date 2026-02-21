"use client";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface DataPoint {
    date: string;
    count: number;
}

interface Props {
    data: DataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="card card-tight" style={{ minWidth: 120 }}>
                <div className="text-muted text-xs">{label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                    {payload[0].value} proofs
                </div>
            </div>
        );
    }
    return null;
};

export default function ProofTimeline({ data }: Props) {
    return (
        <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-subtle)"
                    vertical={false}
                />
                <XAxis
                    dataKey="date"
                    tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--mono)" }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--mono)" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(16, 185, 129, 0.05)" }} />
                <Bar
                    dataKey="count"
                    fill="var(--accent)"
                    fillOpacity={0.8}
                    radius={[2, 2, 0, 0]}
                    maxBarSize={32}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
