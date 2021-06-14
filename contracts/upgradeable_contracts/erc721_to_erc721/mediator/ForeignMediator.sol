pragma solidity 0.4.24;

import "./BasicMediator.sol";
import "../../../libraries/TokenReader.sol";
import "openzeppelin-solidity/contracts/AddressUtils.sol";
import "../interfaces/IForeignMediator.sol";
import "../interfaces/IHomeMediator.sol";

contract ForeignMediator is IForeignMediator, BasicMediator {
    function passMessage(address _tokenContract, address _from, uint256 _tokenId) internal {
        string memory tokenURI = TokenReader.readTokenURI(_tokenContract, _tokenId);

        bytes4 methodSelector = IHomeMediator(0).handleBridgedTokens.selector;
        bytes memory data = abi.encodeWithSelector(methodSelector, _tokenContract, _from, _tokenId, tokenURI);
        bytes32 _messageId = bridgeContract().requireToPassMessage(
            mediatorContractOnOtherSide(),
            data,
            requestGasLimit()
        );
        setMessageTokenContract(_messageId, _tokenContract);
        setMessageTokenId(_messageId, _tokenId);
        setMessageRecipient(_messageId, _from);
    }

    // token bridged from home network
    function handleBridgedTokens(address _recipient, address _tokenContract, uint256 _tokenId) external {
        require(AddressUtils.isContract(_tokenContract));
        require(msg.sender == address(bridgeContract()));
        require(bridgeContract().messageSender() == mediatorContractOnOtherSide());
        erc721token(_tokenContract).transferFrom(this, _recipient, _tokenId);
    }

    // received token to bridge to home network
    function bridgeSpecificActionsOnTokenTransfer(address _tokenContract, address _from, uint256 _tokenId) internal {
        passMessage(_tokenContract, _from, _tokenId);
    }

    // *
    // * @dev Unlock back the amount of tokens that were bridged to the other network but failed.
    // * @param _token address that bridged token contract.
    // * @param _recipient address that will receive the tokens.
    // * @param _value amount of tokens to be received.

    function executeActionOnFixedTokens(
        address _recipient,
        address _tokenContract,
        uint256 _tokenId,
        bytes32 /* _messageId */
    ) internal {
        erc721token(_tokenContract).transferFrom(this, _recipient, _tokenId);
    }
}
