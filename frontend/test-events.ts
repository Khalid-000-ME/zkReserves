import { RpcProvider, hash } from 'starknet';

const provider = new RpcProvider({ nodeUrl: "https://api.cartridge.gg/x/starknet/sepolia" });
const REGISTRY_ADDRESS = "0x05128d4d6dc00fa4faa7bdf53398d377c0f4b81519c0df15ec1f7ff53fc6f152";

async function main() {
    const eventKey = hash.getSelectorFromName("ProofSubmitted");

    // Get current block
    const block = await provider.getBlock('latest');
    const fromBlock = Math.max(0, block.block_number - 50000); // last 50,000 blocks

    console.log("Fetching from block:", fromBlock);

    let allEvents: any[] = [];
    let continuationToken: string | undefined = undefined;

    do {
        const eventsRes = await provider.getEvents({
            from_block: { block_number: fromBlock },
            address: REGISTRY_ADDRESS,
            keys: [[eventKey]],
            chunk_size: 100,
            continuation_token: continuationToken
        });

        allEvents = allEvents.concat(eventsRes.events);
        continuationToken = eventsRes.continuation_token;
        console.log("Got page, continuation:", continuationToken);
    } while (continuationToken);

    console.log("Total events:", allEvents.length);
    if (allEvents.length) console.log(JSON.stringify(allEvents[0], null, 2));
}
main();
