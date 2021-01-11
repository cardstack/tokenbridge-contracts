pragma solidity 0.5.5;

import "../upgradeable_contracts/Sacrifice.sol";

/**
 * @title Address
 * @dev Helper methods for Address type.
 */
library SafeSend {
    /**
    * @dev Try to send native tokens to the address. If it fails, it will force the transfer by creating a selfdestruct contract
    * @param _receiver address that will receive the native tokens
    * @param _value the amount of native tokens to send
    */
    function safeSendValue(address payable _receiver, uint256 _value) internal {
        if (!_receiver.send(_value)) {
            (new Sacrifice).value(_value)(_receiver);
        }
    }
}
