pragma solidity 0.4.24;

import "./BasicMediator.sol";
import "../interfaces/ISimpleBridgeKitty.sol";
import "../interfaces/IHomeMediator.sol";
import "../interfaces/IForeignMediator.sol";

contract HomeMediator is IHomeMediator, BasicMediator {
    function passMessage(address _from, address _tokenContract, uint256 _tokenId, bytes _metadata) internal {
        bytes4 methodSelector = IForeignMediator(0).handleBridgedTokens.selector;

        bytes memory data = abi.encodeWithSelector(methodSelector, _from, _tokenContract, _tokenId);

        bytes32 _messageId = bridgeContract().requireToPassMessage(
            mediatorContractOnOtherSide(),
            data,
            requestGasLimit()
        );

        setMessageTokenContract(_messageId, _tokenContract);
        setMessageTokenId(_messageId, _tokenId);
        setMessageRecipient(_messageId, _from);
        setMessageMetadata(_messageId, _metadata);
    }

    // token arrived from foreign network
    function handleBridgedTokens(address _tokenContractAddress, address _recipient, uint256 _tokenId, string _tokenURI)
        external
    {
        require(msg.sender == address(bridgeContract()));
        require(bridgeContract().messageSender() == mediatorContractOnOtherSide());

        // mintToken(_recipient, _tokenId, _metadata);

    }

    function mintToken(ERC721 _token, address _recipient, uint256 _tokenId, bytes _metadata) internal {
        // nocommit
        // ISimpleBridgeKitty(erc721token()).mint(
        //     _tokenId,
        //     getMetadataBoolValue(_metadata, 2), // isReady
        //     getMetadataUintValue(_metadata, 3), // cooldownIndex
        //     getMetadataUintValue(_metadata, 4), // nextActionAt
        //     getMetadataUintValue(_metadata, 5), // siringWithId
        //     getMetadataUintValue(_metadata, 6), // birthTime
        //     getMetadataUintValue(_metadata, 7), // matronId
        //     getMetadataUintValue(_metadata, 8), // sireId
        //     getMetadataUintValue(_metadata, 9), // generation
        //     getMetadataUintValue(_metadata, 10), // genes
        //     _recipient
        // );
    }

    // received a token to burn and bridge back to the foreign network
    function bridgeSpecificActionsOnTokenTransfer(address _tokenContract, address _from, uint256 _tokenId) internal {
        // bytes memory metadata = getMetadata(_tokenId);
        // nocommit
        // ISimpleBridgeKitty(erc721token()).burn(_tokenId);
        // passMessage(_from, _tokenId, metadata);
    }

    function executeActionOnFixedTokens(
        address _recipient,
        address _tokenContract,
        uint256 _tokenId,
        bytes32 _messageId
    ) internal {
        // nocommit
        // bytes memory metadata = messageMetadata(_messageId);
        // mintToken(_recipient, _tokenId, metadata);
    }
}
