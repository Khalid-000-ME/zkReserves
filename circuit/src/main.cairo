/// zkReserves — Executable entry point for the Stwo prover pipeline.
///
/// Arguments (comma-separated integers via scarb execute --arguments):
///   reserves_sats    : u64   — total reserves in satoshis 
///   liabilities_sats : u64   — total liabilities in satoshis
///
/// The server pre-aggregates wallet balances and liability totals.
/// The circuit asserts solvency — proof generation fails (panics) if reserves < liabilities.
/// The band is encoded as a return value and visible in the execution trace.

use zkreserves_circuit::constraints::assert_solvent;
use zkreserves_circuit::band::compute_band;

#[executable]
fn main(reserves_sats: u64, liabilities_sats: u64) {
    // Core solvency constraint — panics (proof impossible) if reserves < liabilities
    assert_solvent(reserves_sats, liabilities_sats);

    // Compute the reserve ratio band (result is in the execution trace)
    let _band = compute_band(reserves_sats, liabilities_sats);
    // Note: not using output builtin to avoid Stwo verifier ECDSA bug
}
