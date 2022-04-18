pragma solidity 0.4.24;

import "../RewardableBridge.sol";

contract RewardableHomeBridgeErcToNative is RewardableBridge {
    bytes4 internal constant GET_AMOUNT_TO_BURN = 0x916850e9; // getAmountToBurn(uint256)

    /**
     * @dev Updates the fee percentage for home->foreign bridge operations.
     * Only owner is allowed to call this method.
     * If during this operation, home fee is changed, it is highly recommended to stop the bridge operations first.
     * Otherwise, pending signature requests can become a reason for imbalance between two bridge sides.
     * @param _fee new value for fee percentage.
     */
    function setHomeFee(uint256 _fee) external onlyOwner {
        _setFee(feeManagerContract(), _fee, HOME_FEE);
    }

    /**
     * @dev Updates the fee percentage for foreign->home bridge operations.
     * Only owner is allowed to call this method.
     * @param _fee new value for fee percentage.
     */
    function setForeignFee(uint256 _fee) external onlyOwner {
        _setFee(feeManagerContract(), _fee, FOREIGN_FEE);
    }

    function getHomeFee() public view returns (uint256) {
        return _getFee(HOME_FEE);
    }

    function getForeignFee() public view returns (uint256) {
        return _getFee(FOREIGN_FEE);
    }

    function getAmountToBurn(uint256 _value) public view returns (uint256 amount) {
        bytes memory callData = abi.encodeWithSelector(GET_AMOUNT_TO_BURN, _value);
        address feeManager = feeManagerContract();
        assembly {
            // Note: callcode is deprecated and has the wrong msg.sender - changing to delegatecall here
            // reverts, but it's not essential because the getAmountToBurn function in BaseFeeManager
            // does not use this value. Furthermore this bridge mode is not deployed or used in the
            // cardstack bridge at all, and is only used in the test suite
            // If upgrading solidity to > 0.5, delegatecall returns a value without assembly so this
            // construction is uncessessary
            let result := callcode(gas, feeManager, 0x0, add(callData, 0x20), mload(callData), 0, 32)

            switch and(eq(returndatasize, 32), result)
                case 1 {
                    amount := mload(0)
                }
                default {
                    revert(0, 0)
                }
        }
    }
}
