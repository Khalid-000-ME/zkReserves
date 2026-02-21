import { hash } from "starknet";
import fs from "fs";
import path from "path";

function poseidonHashMany(values: bigint[]): bigint {
    return BigInt(hash.computePoseidonHashOnElements(values.map(v => "0x" + v.toString(16))));
}

function leafHash(accountIdHash: bigint, liabilitySatoshi: bigint): bigint {
    return poseidonHashMany([accountIdHash, liabilitySatoshi]);
}

function computeMerkleBranch(leaves: bigint[], index: number) {
    let currentLevel = [...leaves];
    let currentIndex = index;
    // We build the branch. Each step, we need to know the sibling node.
    const branch: { side: "left" | "right", hash: string }[] = [];

    while (currentLevel.length > 1) {
        const nextLevel: bigint[] = [];
        for (let i = 0; i < currentLevel.length; i += 2) {
            const left = currentLevel[i];
            const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;

            // Important: we identify if our path is active in this pair
            if (i === currentIndex || i + 1 === currentIndex) {
                if (i === currentIndex) {
                    // We are at left, so sibling is right
                    branch.push({ side: "right", hash: "0x" + right.toString(16) });
                    currentIndex = Math.floor(i / 2);
                } else {
                    // We are at right, so sibling is left
                    branch.push({ side: "left", hash: "0x" + left.toString(16) });
                    currentIndex = Math.floor(i / 2);
                }
            }

            nextLevel.push(poseidonHashMany([left, right]));
        }
        currentLevel = nextLevel;
    }
    return branch;
}

const args = process.argv.slice(2);
if (args.length < 2) {
    console.error("Usage: ts-node get-branch.ts <account_id> <path_to_csv>");
    process.exit(1);
}

const targetAccount = args[0];
const csvPath = args[1];

if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
}

const csvData = fs.readFileSync(path.resolve(csvPath), "utf8");
const lines = csvData.trim().split("\n").filter(l => l.trim() && !l.startsWith("#"));

let dataLines = lines;
if (lines[0]?.toLowerCase().includes("account")) {
    dataLines = lines.slice(1);
}

const parsedLeaves: { id: string, amount: bigint, index: number }[] = [];
let targetIndex = -1;
let targetAmount = 0n;

for (let i = 0; i < dataLines.length; i++) {
    const parts = dataLines[i].split(",").map(p => p.trim());
    if (parts.length < 2) continue;

    const amount = BigInt(parts[1].replace(/[^0-9]/g, ""));
    parsedLeaves.push({ id: parts[0], amount, index: i });

    if (parts[0] === targetAccount) {
        targetIndex = i;
        targetAmount = amount;
    }
}

if (targetIndex === -1) {
    console.error(`Account ID '${targetAccount}' not found in the CSV.`);
    process.exit(1);
}

const leafHashes = parsedLeaves.map(({ id, amount }) => {
    let idFelt = 0n;
    for (const char of id) {
        idFelt = (idFelt << 8n) | BigInt(char.charCodeAt(0));
    }
    idFelt = idFelt % (2n ** 251n);
    return leafHash(idFelt, amount);
});

const branch = computeMerkleBranch(leafHashes, targetIndex);

console.log("\n===============================================");
console.log(` Account Check: ${targetAccount}`);
console.log(` Balance:       ${targetAmount} satoshi`);
console.log("===============================================\n");
console.log("For the Verify Tool, copy/paste this precise JSON array into 'Merkle branch JSON':\n");
console.log(JSON.stringify(branch));
console.log("\n");
