/// Poseidon-based binary Merkle tree for liability commitments.
///
/// Leaf hashing: Poseidon(account_id_hash, liability_satoshi)
/// Node hashing:  Poseidon(left_child, right_child)
///
/// The tree is always complete — single elements are padded with their hash.

use core::poseidon::poseidon_hash_span;

/// Compute a single leaf hash from (account_id_hash, liability_satoshi).
pub fn leaf_hash(account_id_hash: felt252, liability_satoshi: u64) -> felt252 {
    let satoshi_felt: felt252 = liability_satoshi.into();
    poseidon_hash_span(array![account_id_hash, satoshi_felt].span())
}

/// Compute the Merkle root of a flat array of leaves.
/// The array must be non-empty. If odd length, the last leaf is duplicated.
pub fn compute_merkle_root(leaves: Array<felt252>) -> felt252 {
    let n = leaves.len();
    assert(n > 0, 'Merkle: empty leaves');

    if n == 1 {
        return *leaves.at(0);
    }

    let mut current_level: Array<felt252> = leaves;

    loop {
        let level_len = current_level.len();
        if level_len == 1 {
            break;
        }

        let mut next_level: Array<felt252> = ArrayTrait::new();
        let mut i: u32 = 0;

        loop {
            if i >= level_len {
                break;
            }
            let left = *current_level.at(i);
            // If odd, duplicate last element
            let right = if i + 1 < level_len {
                *current_level.at(i + 1)
            } else {
                left
            };
            let parent = poseidon_hash_span(array![left, right].span());
            next_level.append(parent);
            i += 2;
        };

        current_level = next_level;
    };

    *current_level.at(0)
}

/// Build Merkle root from parallel arrays of account_ids and liability_amounts.
pub fn build_liability_root(
    account_id_hashes: @Array<felt252>, liability_amounts: @Array<u64>,
) -> felt252 {
    let n = account_id_hashes.len();
    assert(n == liability_amounts.len(), 'Length mismatch');
    assert(n > 0, 'No liabilities');

    let mut leaves: Array<felt252> = ArrayTrait::new();
    let mut i: u32 = 0;

    loop {
        if i >= n {
            break;
        }
        let lh = leaf_hash(*account_id_hashes.at(i), *liability_amounts.at(i));
        leaves.append(lh);
        i += 1;
    };

    compute_merkle_root(leaves)
}
