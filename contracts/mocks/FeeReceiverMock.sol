pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol";
import "../libraries/SafeERC20.sol";

contract FeeReceiverMock {
    using SafeERC20 for ERC20Basic;

    address public mediator;
    address public token;

    constructor(address _mediator, address _token) public {
        mediator = _mediator;
        token = _token;
    }

    function onTokenTransfer(address, uint256 _value, bytes) external returns (bool) {
        ERC20Basic(token).safeTransfer(mediator, _value);
        return true;
    }
}
