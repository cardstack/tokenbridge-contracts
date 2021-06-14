pragma solidity 0.4.24;

interface IForeignMediator {
    function handleBridgedTokens(address _recipient, address _tokenContract, uint256 _tokenId) external;
}
