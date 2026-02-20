/// Reserve ratio band computation.
///
/// Bands:
///   0 — undercollateralized (<100%) — circuit WILL panic before reaching here
///   1 — 100–110%
///   2 — 110–120%
///   3 — ≥120%
///
/// Note: Using integer arithmetic only (no floats in Cairo).

/// Compute the reserve ratio band.
///
/// We compute:  ratio_pct = (reserves * 100) / liabilities
/// This gives the integer floor of the percentage.
///
/// Precondition: liabilities > 0 (enforced by constraints.cairo)
/// Precondition: reserves >= liabilities (enforced by assert_solvent)
pub fn compute_band(reserves: u64, liabilities: u64) -> u8 {
    assert(liabilities > 0, 'Liabilities must be > 0');
    // Use u128 for intermediate multiplication to avoid overflow
    let reserves_128: u128 = reserves.into();
    let liabilities_128: u128 = liabilities.into();
    let ratio_pct_128: u128 = (reserves_128 * 100_u128) / liabilities_128;

    // ratio_pct is guaranteed >= 100 due to assert_solvent
    if ratio_pct_128 < 110_u128 {
        1_u8 // 100–110%
    } else if ratio_pct_128 < 120_u128 {
        2_u8 // 110–120%
    } else {
        3_u8 // ≥120%
    }
}

/// Returns a human-readable label for the band.
/// Returns a felt252 encoding of the string.
pub fn band_label(band: u8) -> felt252 {
    if band == 1_u8 {
        '100-110%'
    } else if band == 2_u8 {
        '110-120%'
    } else if band == 3_u8 {
        '>=120%'
    } else {
        'INVALID'
    }
}
