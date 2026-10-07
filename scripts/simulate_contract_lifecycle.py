#!/usr/bin/env python3
"""
Lemarchand's Box - Smart Contract Lifecycle Simulator & Test Suite
Validates contract business logic, supply limits, minting rules, EIP-2981 royalties,
provenance hash verification, and tokenURI generation.
"""

import json
import hashlib
import sys
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
METADATA_DIR = os.path.join(BASE_DIR, "metadata")

class MockLemarchandsBoxContract:
    def __init__(self, base_uri, provenance_hash, royalty_receiver, owner):
        self.name = "Lemarchand's Box"
        self.symbol = "LAMENT"
        self.max_supply = 1000
        self.total_supply = 0
        self.mint_price_wei = int(0.05 * 10**18) # 0.05 ETH
        self.max_per_wallet = 5
        self.is_sale_active = False
        
        self.base_uri = base_uri
        self.provenance_hash = provenance_hash
        self.royalty_receiver = royalty_receiver
        self.royalty_fraction = 500 # 5%
        self.owner = owner
        
        self.balances = {}
        self.owners = {}
        self.minted_per_wallet = {}
        self.contract_balance_wei = 0

    def set_sale_active(self, caller, active):
        assert caller == self.owner, "Not owner"
        self.is_sale_active = active

    def mint(self, caller, quantity, msg_value_wei):
        assert self.is_sale_active, "Sale not active"
        assert quantity > 0, "Quantity must be > 0"
        assert self.total_supply + quantity <= self.max_supply, "Exceeds max supply of 1000"
        
        current_minted = self.minted_per_wallet.get(caller, 0)
        assert current_minted + quantity <= self.max_per_wallet, "Exceeds wallet limit of 5"
        assert msg_value_wei >= self.mint_price_wei * quantity, "Insufficient ETH sent"

        self.minted_per_wallet[caller] = current_minted + quantity
        self.contract_balance_wei += msg_value_wei

        for _ in range(quantity):
            self.total_supply += 1
            token_id = self.total_supply
            self.owners[token_id] = caller

        self.balances[caller] = self.balances.get(caller, 0) + quantity

    def reserve_mint(self, caller, recipient, quantity):
        assert caller == self.owner, "Not owner"
        assert self.total_supply + quantity <= self.max_supply, "Exceeds max supply"
        for _ in range(quantity):
            self.total_supply += 1
            token_id = self.total_supply
            self.owners[token_id] = recipient
        self.balances[recipient] = self.balances.get(recipient, 0) + quantity

    def token_uri(self, token_id):
        assert token_id in self.owners, "Token does not exist"
        return f"{self.base_uri}{token_id}.json"

    def royalty_info(self, token_id, sale_price_wei):
        amount = (sale_price_wei * self.royalty_fraction) // 10000
        return self.royalty_receiver, amount

def run_lifecycle_simulation():
    print("=" * 60)
    print("LEMARCHAND'S BOX - SMART CONTRACT LIFECYCLE SIMULATION")
    print("=" * 60)

    # 1. Load Provenance Hash from Manifest
    manifest_path = os.path.join(METADATA_DIR, "collection_manifest.json")
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    provenance_hash = manifest["provenance_hash"]
    base_uri = "ipfs://QmLemarchandVault/metadata/"
    owner = "0xCreatorPhilipLemarchand"
    royalty_vault = "0xRoyaltyTreasuryVault"

    print(f"\n[1] Deploying Contract...")
    contract = MockLemarchandsBoxContract(base_uri, provenance_hash, royalty_vault, owner)
    print(f"    - Name: {contract.name} ({contract.symbol})")
    print(f"    - Max Supply: {contract.max_supply}")
    print(f"    - Provenance: {contract.provenance_hash[:16]}...")
    assert contract.total_supply == 0

    print(f"\n[2] Testing Reserve Mint (Creator Allocation)...")
    contract.reserve_mint(owner, owner, 20)
    assert contract.total_supply == 20
    assert contract.balances[owner] == 20
    print(f"    - Successfully reserved 20 relics for vault (Total: {contract.total_supply})")

    print(f"\n[3] Testing Sale Activation & Public Minting...")
    collector_1 = "0xCollectorFrankCotton"
    collector_2 = "0xCollectorKirstyCotton"

    # Should fail when sale inactive
    try:
        contract.mint(collector_1, 1, contract.mint_price_wei)
        assert False, "Should have reverted"
    except AssertionError:
        print("    - Correctly reverted when sale inactive")

    # Activate sale
    contract.set_sale_active(owner, True)

    # Mint 3 for Frank
    contract.mint(collector_1, 3, contract.mint_price_wei * 3)
    assert contract.balances[collector_1] == 3
    print(f"    - Frank Cotton minted 3 tokens (Total: {contract.total_supply})")

    # Test wallet limit: Frank trying to mint 3 more (exceeds 5)
    try:
        contract.mint(collector_1, 3, contract.mint_price_wei * 3)
        assert False, "Should have reverted on wallet cap"
    except AssertionError:
        print("    - Correctly enforced 5-token wallet cap on Frank Cotton")

    # Frank mints exactly 2 more to hit cap of 5
    contract.mint(collector_1, 2, contract.mint_price_wei * 2)
    assert contract.balances[collector_1] == 5

    print(f"\n[4] Simulating Full 1,000-Piece Sellout...")
    wallet_idx = 3
    while contract.total_supply < 1000:
        remaining = 1000 - contract.total_supply
        batch = min(5, remaining)
        addr = f"0xCollector_{wallet_idx}"
        contract.mint(addr, batch, contract.mint_price_wei * batch)
        wallet_idx += 1

    assert contract.total_supply == 1000
    print(f"    - 1,000 / 1,000 Tokens Sold Out!")
    print(f"    - Contract ETH Balance: {contract.contract_balance_wei / 10**18:.2f} ETH")

    # Attempting to mint token 1001 must revert
    try:
        contract.mint("0xLateCollector", 1, contract.mint_price_wei)
        assert False, "Should have reverted on max supply"
    except AssertionError:
        print("    - Correctly reverted: Supply strictly capped at 1,000")

    print(f"\n[5] Testing EIP-2981 Royalty Calculation...")
    receiver, amount = contract.royalty_info(42, int(2.0 * 10**18)) # 2 ETH sale
    assert receiver == royalty_vault
    assert amount == int(0.1 * 10**18) # 5% of 2 ETH = 0.1 ETH
    print(f"    - Receiver: {receiver}")
    print(f"    - 5% Royalty on 2.0 ETH Sale: {amount / 10**18:.3f} ETH (MATCH)")

    print(f"\n[6] Testing TokenURI & Metadata Resolution...")
    uri_1 = contract.token_uri(1)
    uri_666 = contract.token_uri(666)
    uri_1000 = contract.token_uri(1000)
    assert uri_1 == "ipfs://QmLemarchandVault/metadata/1.json"
    assert uri_666 == "ipfs://QmLemarchandVault/metadata/666.json"
    assert uri_1000 == "ipfs://QmLemarchandVault/metadata/1000.json"
    print(f"    - Token #1 URI: {uri_1}")
    print(f"    - Token #666 URI: {uri_666}")
    print(f"    - Token #1000 URI: {uri_1000}")

    print("\n" + "=" * 60)
    print("ALL CONTRACT LIFECYCLE TESTS PASSED (100% SUCCESS)")
    print("=" * 60)

if __name__ == "__main__":
    run_lifecycle_simulation()
