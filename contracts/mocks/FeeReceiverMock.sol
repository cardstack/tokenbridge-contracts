pragma solidity 0.5.5;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FeeReceiverMock {
    address public mediator;
    address public token;

    constructor(address _mediator, address _token) public {
        mediator = _mediator;
        token = _token;
    }

    function onTokenTransfer(address, uint256 _value, bytes calldata) external returns (bool) {
        ERC20(token).transfer(mediator, _value);
        return true;
    }
}
