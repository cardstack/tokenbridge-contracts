pragma solidity 0.5.5;

import "../libraries/SafeSend.sol";

contract RevertFallback {
    function() external payable {
        revert();
    }

    function receiveEth() public payable {
        // solhint-disable-previous-line no-empty-blocks
    }

    function sendEth(address payable _receiver, uint256 _value) public {
        // solhint-disable-next-line check-send-result
        require(_receiver.send(_value));
    }

    function safeSendEth(address payable _receiver, uint256 _value) public {
        SafeSend.safeSendValue(_receiver, _value);
    }
}
