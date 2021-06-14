pragma solidity 0.4.24;

interface IHomeMediator {
    function handleBridgedTokens(address _tokenContractAddress, address _recipient, uint256 _tokenId, string _tokenURI)
        external;
}
