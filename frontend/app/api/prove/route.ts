import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Pass request natively through to the Express Prover API backend
        const response = await fetch("http://127.0.0.1:8080/api/prove", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errBody = await response.text();
            return NextResponse.json({ error: `Prover API failed: ${errBody}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (err: any) {
        console.error("Next.js API route error contacting prover:", err);
        return NextResponse.json({ error: err.message || "Failed to contact prover API" }, { status: 500 });
    }
}
