pragma solidity 0.5.5;

interface IMediatorFeeManager {
    function calculateFee(uint256) external view returns (uint256);
}
