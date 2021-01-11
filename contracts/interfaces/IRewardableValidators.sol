pragma solidity 0.5.5;

interface IRewardableValidators {
    function isValidator(address _validator) external view returns (bool);
    function requiredSignatures() external view returns (uint256);
    function owner() external view returns (address);
    function validatorList() external view returns (address[] memory);
    function getValidatorRewardAddress(address _validator) external view returns (address);
    function validatorCount() external view returns (uint256);
    function getNextValidator(address _address) external view returns (address);
}
