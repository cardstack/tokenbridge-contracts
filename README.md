# Cardstack Tokenbridge

Forked from [POA Bridge Smart Contracts](https://github.com/poanetwork/tokenbridge-contracts) at commit [835742](https://github.com/poanetwork/tokenbridge-contracts/commit/835742dfd8f1c869d4e7b61582155d250d6cf094)

# Differences from upstream

1. Removed most types of token bridging, only left code to support multi-token bridge ERC20 <=> ERC677
2. Foreign mediator has a whitelist of allowed tokens to bridge to L2/Home network
3. Home mediator registers a supplier safe, or uses an existing one, and transfers tokens to that safe instead of direct to the user
4. Home mediator adds " (CPXD)" to token name and ".CPXD" to token symbol
5. Token proxy on L2 is dynamic - code for all deployed tokens on L2 can be updated with one transaction
6. Added NFT bridge POC
7. Converted to hardhat to enable console logging / stacktraces in solidity
8. Integrate deploy and upgrade scripts into main package.json

# Operation Summary

The cardstack tokenbridge is designed to allow bridging whitelisted ERC20/ERC677 tokens between L1 and L2 networks. Currently this is
supported between ethereum mainnet and xdai / gnosis chain, and uses the externally hosted arbitrary message bridge to do so.

On the "Foreign" (mainnet) side, either tokens can be transferred to the mediator using ERC677 `transferAndCall`, or the more
standard approve flow may be used, after which the `relayTokens` is called. This causes the tokens to be locked in the
bridge mediator, and a message to be published to the arbitrary message bridge.

The "Home" (xdai / gnosis) mediator, upon receiving a message that a token bridging request has been made from the AMB contract in
that network, first checks to see if this type of token has been bridged before, by looking at the token contract address.

If it is the first time a token has been bridged, a new token proxy contract is deployed, with the token name set to
"Original Name (CPXD)", the symbol set to "OriginalSymbol.CPXD", and the decimals value preserved.

> Note: CPXD stands for "Card Protocol on xDai"

If any amount of the token has been bridged previously, the previously deployed token proxy contract is used.

The amount bridged is minted to the address on the home side specified in the message. The user now has the same
amount of tokens on layer 2 that they locked on layer 1.

The same process works in reverse. On L2, upon transferring tokens to the home bridge mediator contract (no need for
approve on L2 as all CPXD tokens are ERC677), the tokens are burnt on L2 and a message is passed to L1. The Foreign
mediator contract on L2 releases the amount of tokens specified in the message to the address the user specified.

There is also an as yet undeployed ERC721 bridge that operates on the same principles. The differences are:

- No decimals for the token proxy contract, only name and symbol
- Instead of an amount of tokens, a tokenId and tokenURI are bridged instead. The tokenId is canonical, the tokenURI is read
  at time of bridging so that useful metadata can be displayed on L2

See [contracts/upgradeable_contracts/multi_amb_erc20_to_erc677/callflows.md](callflows.md) for more in-depth dive into the
bridging callflows

# Overview of the different forms of proxy-implementation upgrade patterns

This repo uses two proxy implementation patterns.

The first pattern is a standard OwnedUpgradeabilityProxy, which is taken from OpenZepplin contracts and well
documented in that library.

The second pattern is used in the bridged token implementation. Because each new type of token bridged requires a new
ERC677 contract to be deployed on L2, a single implementation contract is deployed on L2 in advance, and then when a new
type of token is bridged, a proxy contract is deployed that uses that implementation contract to forward method calls to using
delegatecall (see TokenProxy.sol).

This contract is a subclass of the standard OpenZepplin Proxy contract. There is one unusual implementation detail of
the proxy, and that is that the implementation address is dynamic. The implementation address is stored once,
in the bridge mediator contract, and for every call the TokenProxy contract asks the bridge mediator what the
current token implementation address is. The reason for this design decision is so that the token proxy
implementation can be upgraded at any time atomically for all deployed token contracts with a single call
to the bridge mediator, instead of requiring iterating through each bridged token type. This allows
wholesale token implementation upgrades on L2 where necessary.

# How to Deploy POA Bridge Contracts

1. Create a `.env` file.

```
cd deploy
cp .env.example .env
```

3. If necessary, deploy and configure a multi-sig wallet contract to manage the bridge contracts after deployment. We have not audited any wallets for security, but have used https://github.com/gnosis/MultiSigWallet/ with success.

4. Adjust the parameters in the `.env` file depending on the desired bridge mode. See below for comments related to each parameter.

5. Add funds to the deployment accounts in both the Home and Foreign networks.

6. Run `yarn run deploy`.

## `NATIVE-TO-ERC` Bridge Mode Configuration Example.

This example of an `.env` file for the `native-to-erc` bridge mode includes comments describing each parameter.

# Testing

```bash
./scripts/test.sh
```

See package.json for more useful scripts, and deploy/README.md for deploy instructions
