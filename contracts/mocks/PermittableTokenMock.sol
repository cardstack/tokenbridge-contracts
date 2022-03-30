pragma solidity 0.4.24;

import "../PermittableToken.sol";

contract PermittableTokenMock is PermittableToken {
    function mockSetOwner(address _newOwner) public {
        owner = _newOwner;
    }
}
