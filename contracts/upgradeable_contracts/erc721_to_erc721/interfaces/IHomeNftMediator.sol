pragma solidity 0.4.24;

interface IHomeNftMediator {
    function handleBridgedTokens(
        address _tokenContractAddress,
        string _name,
        string _symbol,
        address _recipient,
        uint256 _tokenId,
        string _tokenURI
    ) external;

}
