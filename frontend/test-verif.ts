import { hash } from "starknet";

const accountId = "0x0190fd83bfaf5eff6aa4238eabcb87b47b461cdb535d883b2762b7ae1ea11462";
const balanceSat = 3990;

let accFelt = 0n;
for (const char of accountId) {
    accFelt = (accFelt << 8n) | BigInt(char.charCodeAt(0));
}
accFelt = accFelt % (2n ** 251n);

const bal = BigInt(balanceSat);

const leaf = BigInt(hash.computePoseidonHashOnElements(["0x" + accFelt.toString(16), "0x" + bal.toString(16)]));

console.log("Leaf Hash:", leaf.toString(16));

const merklePath = `[{"side":"left","hash":"0x6e59a9b625350158b75e4be58aa5a601396e17c0975e3cbebe396975c7e389f"},{"side":"right","hash":"0x576a5db5ffae08f03ec6aa2afa37a754bb85b238b067fa29ff54e238313c474"},{"side":"right","hash":"0x23fd4c80337e51d5ec3703afd9e162c4559dc968f82a98caba5d4830599dbc5"},{"side":"left","hash":"0x1220963e98d1a9145ceaef5a0bdfcc559a134e058b820156fb3218f1cbd8f5a"}]`;
const pathObj = JSON.parse(merklePath);

let currentHash = leaf;
for (const p of pathObj) {
    if (p.side === "left") {
        currentHash = BigInt(hash.computePoseidonHashOnElements([p.hash, "0x" + currentHash.toString(16)]));
    } else {
        currentHash = BigInt(hash.computePoseidonHashOnElements(["0x" + currentHash.toString(16), p.hash]));
    }
}

console.log("Calculated Root:", currentHash.toString(16));
