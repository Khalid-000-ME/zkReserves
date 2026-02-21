"use client";
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface Props {
    data: Array<{ band: number; count: number }>;
}

const LABELS = ["", "100–110%", "110–120%", "≥ 120%"];
const COLORS = ["", "#F59E0B", "#86EFAC", "#10B981"];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="card card-tight" style={{ minWidth: 120 }}>
                <div className="text-muted text-xs">{payload[0].name}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                    {payload[0].value} entities
                </div>
            </div>
        );
    }
    return null;
};

export default function RatioDistribution({ data }: Props) {
    const chartData = data
        .filter((d) => d.band > 0 && d.count > 0)
        .map((d) => ({
            name: LABELS[d.band] || `Band ${d.band}`,
            value: d.count,
            band: d.band,
        }));

    if (chartData.length === 0) {
        return (
            <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p className="text-muted text-sm">No active proofs</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={180}>
            <PieChart margin={{ top: 10, bottom: 10 }}>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                >
                    {chartData.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={COLORS[entry.band] || "#6B7280"}
                        />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    verticalAlign="bottom"
                    formatter={(value) => (
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{value}</span>
                    )}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
