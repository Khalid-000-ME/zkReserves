"use client";

import {
    StarknetConfig,
    braavos,
    argent,
    jsonRpcProvider,
    InjectedConnector,
} from "@starknet-react/core";
import { sepolia, mainnet } from "@starknet-react/chains";

function rpc() {
    return {
        nodeUrl:
            process.env.NEXT_PUBLIC_STARKNET_RPC ||
            "https://api.cartridge.gg/x/starknet/sepolia",
    };
}

// Include both named connectors AND generic injected connector
// so any installed Starknet wallet (Braavos, Argent X, etc.) is detected
const connectors = [
    braavos(),
    argent(),
    new InjectedConnector({ options: { id: "braavos", name: "Braavos" } }),
    new InjectedConnector({ options: { id: "argentX", name: "Argent X" } }),
];

export function StarknetProvider({ children }: { children: React.ReactNode }) {
    return (
        <StarknetConfig
            chains={[sepolia, mainnet]}
            provider={jsonRpcProvider({ rpc })}
            connectors={connectors}
        >
            {children}
        </StarknetConfig>
    );
}
