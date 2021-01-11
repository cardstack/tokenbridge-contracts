pragma solidity 0.5.5;

import "../PermittableToken.sol";

contract PermittableTokenMock is PermittableToken {
    uint256 private _blockTimestamp;

    constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _chainId)
        public
        PermittableToken(_name, _symbol, _decimals, _chainId)
    {
        // solhint-disable-previous-line no-empty-blocks
    }

    function setNow(uint256 _timestamp) public {
        _blockTimestamp = _timestamp;
    }

    function _now() internal view returns (uint256) {
        return _blockTimestamp != 0 ? _blockTimestamp : now;
    }

}
