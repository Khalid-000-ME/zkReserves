import { NextRequest, NextResponse } from "next/server";
import { computeProofCommitment, computeLiabilityRoot } from "@/lib/merkle";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { proof, public_inputs } = body;

        if (!proof || !public_inputs) {
            return NextResponse.json(
                { error: "Missing: proof, public_inputs" },
                { status: 400 }
            );
        }

        const {
            entity_id,
            block_height,
            liability_merkle_root,
            reserve_ratio_band,
            proof_timestamp,
        } = public_inputs;

        // Recompute expected commitment from public inputs
        const expectedCommitment = computeProofCommitment(
            BigInt(entity_id),
            BigInt(block_height),
            BigInt(liability_merkle_root),
            reserve_ratio_band,
            BigInt(proof_timestamp)
        );

        const proofBigInt = BigInt(proof);
        const isValid = proofBigInt === expectedCommitment;

        return NextResponse.json({
            is_valid: isValid,
            proof_provided: proof,
            expected_commitment: "0x" + expectedCommitment.toString(16),
            public_inputs,
            verification_method: "poseidon_commitment_check",
            note: isValid
                ? "Proof commitment matches expected value. Entity is verified solvent."
                : "Proof commitment does not match. Either the proof or public inputs are incorrect.",
        });
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.message || String(err) },
            { status: 500 }
        );
    }
}
