pragma solidity 0.5.5;

import "../../libraries/SafeSend.sol";
import "../ValidatorsFeeManager.sol";

contract FeeManagerNativeToErcBothDirections is ValidatorsFeeManager {
    function getFeeManagerMode() external pure returns (bytes4) {
        return 0xd7de965f; // bytes4(keccak256(abi.encodePacked("manages-both-directions")))
    }

    function onAffirmationFeeDistribution(address _rewardAddress, uint256 _fee) internal {
        _sendReward(_rewardAddress, _fee);
    }

    function onSignatureFeeDistribution(address _rewardAddress, uint256 _fee) internal {
        _sendReward(_rewardAddress, _fee);
    }

    function _sendReward(address _rewardAddress, uint256 _fee) internal {
        SafeSend.safeSendValue(_rewardAddress, _fee);
    }
}
