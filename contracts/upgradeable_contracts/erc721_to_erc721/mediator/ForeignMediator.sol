pragma solidity 0.4.24;

import "./BasicMediator.sol";
import "../interfaces/IHomeMediator.sol";

contract ForeignMediator is BasicMediator {
    function passMessage(address _from, uint256 _tokenId) internal {
        bytes memory metadata = getMetadata(_tokenId);

        bytes4 methodSelector = IHomeMediator(0).handleBridgedTokens.selector;
        bytes memory data = abi.encodeWithSelector(methodSelector, _from, _tokenId, metadata);

        bytes32 _messageId = bridgeContract().requireToPassMessage(
            mediatorContractOnOtherSide(),
            data,
            requestGasLimit()
        );
        setMessageTokenId(_messageId, _tokenId);
        setMessageRecipient(_messageId, _from);

    }

    function handleBridgedTokens(address _recipient, uint256 _tokenId) external {
        require(msg.sender == address(bridgeContract()));
        require(bridgeContract().messageSender() == mediatorContractOnOtherSide());
        erc721token().transfer(_recipient, _tokenId);
    }

    function bridgeSpecificActionsOnTokenTransfer(address _from, uint256 _tokenId) internal {
        passMessage(_from, _tokenId);
    }

    // *
    // * @dev Unlock back the amount of tokens that were bridged to the other network but failed.
    // * @param _token address that bridged token contract.
    // * @param _recipient address that will receive the tokens.
    // * @param _value amount of tokens to be received.

    function executeActionOnFixedTokens(
        address _recipient,
        uint256 _tokenId,
        bytes32 /* _messageId */
    ) internal {
        erc721token().transfer(_recipient, _tokenId);
    }
}
