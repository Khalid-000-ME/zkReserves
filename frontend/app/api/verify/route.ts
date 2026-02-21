import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const proverUrl = process.env.PROVER_API_URL || "http://127.0.0.1:8080";
        // Pass request natively through to the Express Prover API backend
        const response = await fetch(`${proverUrl}/api/verify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errBody = await response.text();
            return NextResponse.json({ error: `Verifier API failed: ${errBody}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (err: any) {
        console.error("Next.js API route error contacting prover:", err);
        return NextResponse.json({ error: err.message || "Failed to contact verifier API" }, { status: 500 });
    }
}
