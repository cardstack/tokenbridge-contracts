pragma solidity 0.4.24;

import "./ERC677BridgeToken.sol";

// Note: this contract is still called PermittableToken, but the Permittable
// functionality has been removed as unecessary in the card pay protocol.
// The ___deprecated___ storage slots below were used in that implementation

contract PermittableToken is ERC677BridgeToken {
    // solhint-disable-next-line var-name-mixedcase
    bytes32 public ___deprecated___DOMAIN_SEPARATOR;
    // solhint-disable-next-line var-name-mixedcase
    mapping(address => uint256) public ___deprecated___nonces;
    // solhint-disable-next-line var-name-mixedcase
    mapping(address => mapping(address => uint256)) public ___deprecated___expirations;

    constructor(string _name, string _symbol, uint8 _decimals) public ERC677BridgeToken(_name, _symbol, _decimals) {
        // solhint-disable-previous-line no-empty-blocks
    }

}
