pragma solidity 0.4.24;

import "../PermittableToken.sol";

contract UpdatedPermittableTokenMock is PermittableToken {
    constructor(string _name, string _symbol, uint8 _decimals, uint256 _chainId)
        public
        PermittableToken(_name, _symbol, _decimals, _chainId)
    {
        // solhint-disable-previous-line no-empty-blocks
    }

    function foo(address _user) public view returns (uint256) {
        return balanceOf(_user);
    }
}
