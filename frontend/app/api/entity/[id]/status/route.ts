import { NextRequest, NextResponse } from "next/server";
import { formatRelativeTime, daysUntilExpiry, bandLabel } from "@/lib/starknet";

// Demo entity data — in production these would be fetched from the Starknet contract
const DEMO_ENTITIES: Record<string, any> = {
    "0xkraken": {
        entity_id: "0xkraken",
        name: "Kraken",
        status: "active",
        reserve_ratio_band: 3,
        block_height: 880412,
        proof_timestamp: Math.floor(Date.now() / 1000) - 7200,
        expiry_timestamp: Math.floor(Date.now() / 1000) + 2419200,
        submission_count: 12,
        is_expired: false,
    },
    "0xnexo": {
        entity_id: "0xnexo",
        name: "Nexo",
        status: "active",
        reserve_ratio_band: 2,
        block_height: 880001,
        proof_timestamp: Math.floor(Date.now() / 1000) - 86400,
        expiry_timestamp: Math.floor(Date.now() / 1000) + 2246400,
        submission_count: 8,
        is_expired: false,
    },
    "0xmaple": {
        entity_id: "0xmaple",
        name: "Maple Finance",
        status: "expiring",
        reserve_ratio_band: 3,
        block_height: 878500,
        proof_timestamp: Math.floor(Date.now() / 1000) - 2419200 + 172800,
        expiry_timestamp: Math.floor(Date.now() / 1000) + 172800,
        submission_count: 3,
        is_expired: false,
    },
};

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const entity = DEMO_ENTITIES[id];

    if (!entity) {
        return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }

    const days = daysUntilExpiry(entity.expiry_timestamp);

    return NextResponse.json({
        ...entity,
        reserve_ratio_label: bandLabel(entity.reserve_ratio_band),
        days_until_expiry: days,
        proof_timestamp_formatted: formatRelativeTime(entity.proof_timestamp),
    });
}
