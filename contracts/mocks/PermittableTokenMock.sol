pragma solidity 0.4.24;

import "../PermittableToken.sol";

contract PermittableTokenMock is PermittableToken {
    // solhint-disable-next-line no-empty-blocks
    constructor(string _name, string _symbol, uint8 _decimals) public PermittableToken(_name, _symbol, _decimals) {}

    function mockSetBridgeContract(address _bridgeContract) public {
        owner = _bridgeContract;
        bridgeContractAddr = _bridgeContract;
    }
}
