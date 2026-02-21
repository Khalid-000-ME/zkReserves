"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useDisconnect } from "@starknet-react/core";
import {
    ChartBarIcon,
    ShieldCheckIcon,
    Squares2X2Icon,
    ArrowRightOnRectangleIcon,
    WalletIcon,
} from "@heroicons/react/24/outline";

const PUBLIC_LINKS = [
    { href: "/registry", label: "Registry", icon: ChartBarIcon },
    { href: "/verify", label: "Verify", icon: ShieldCheckIcon },
];

export default function Navbar() {
    const pathname = usePathname();
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();

    const isLanding = pathname === "/";

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                {/* Logo */}
                <Link href="/" className="navbar-logo">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <rect width="20" height="20" rx="4" fill="#10B981" fillOpacity="0.12" />
                        <path d="M10 4L4 7.5V12.5L10 16L16 12.5V7.5L10 4Z" stroke="#10B981" strokeWidth="1.2" strokeLinejoin="round" />
                        <path d="M10 8L7 9.5V12.5L10 14L13 12.5V9.5L10 8Z" fill="#10B981" fillOpacity="0.3" />
                    </svg>
                    zk<span>Reserves</span>
                </Link>

                {/* Center links */}
                <div className="navbar-links">
                    {PUBLIC_LINKS.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`nav-link${pathname.startsWith(href) ? " active" : ""}`}
                        >
                            <Icon style={{ width: 14, height: 14 }} />
                            {label}
                        </Link>
                    ))}
                    {isConnected && (
                        <Link
                            href="/dashboard"
                            className={`nav-link${pathname === "/dashboard" ? " active" : ""}`}
                        >
                            <Squares2X2Icon style={{ width: 14, height: 14 }} />
                            Dashboard
                        </Link>
                    )}
                    <Link href="/docs" className={`nav-link${pathname === "/docs" ? " active" : ""}`}
                        style={{ display: "none" }}>
                        Docs
                    </Link>
                </div>

                {/* Right actions */}
                <div className="navbar-actions">
                    <span className="badge badge-orange" style={{ fontSize: 10 }}>Sepolia</span>

                    {isConnected ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Link href="/dashboard" className="btn btn-secondary btn-sm" style={{ fontFamily: "var(--mono)", fontSize: 11 }}>
                                <WalletIcon style={{ width: 13, height: 13 }} />
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </Link>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => disconnect()}
                                title="Disconnect wallet"
                            >
                                <ArrowRightOnRectangleIcon style={{ width: 14, height: 14 }} />
                            </button>
                        </div>
                    ) : (
                        <Link
                            href={isLanding ? "/onboard" : "/onboard"}
                            className="btn btn-primary btn-sm"
                        >
                            <WalletIcon style={{ width: 14, height: 14 }} />
                            {isLanding ? "Register Exchange" : "Connect"}
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
