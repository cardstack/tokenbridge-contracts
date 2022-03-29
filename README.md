# Cardstack Tokenbridge

Forked from [POA Bridge Smart Contracts](https://github.com/poanetwork/tokenbridge-contracts) at commit [835742](https://github.com/poanetwork/tokenbridge-contracts/commit/835742dfd8f1c869d4e7b61582155d250d6cf094)

# Differences from upstream

1. Removed most types of token bridging, only left code to support multi-token bridge ERC20 <=> ERC677
2. Foreign mediator has a whitelist of allowed tokens to bridge to L2/Home network
3. Home mediator registers a supplier safe, or uses an existing one, and transfers tokens to that safe instead of direct to the user
4. Home mediator adds " (CPXD)" to token name and ".CPXD" to token symbol
5. Token proxy on L2 is dynamic - code for all deployed tokens on L2 can be updated with one transaction
6. Added NFT bridge POC

# Testing

```bash
./scripts/test.sh
```

See package.json for more useful scripts, and deploy/README.md for deploy instructions
