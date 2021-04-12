pragma solidity 0.4.24;

import "./BasicMediator.sol";
import "../interfaces/IForeignMediator.sol";
import "../interfaces/ISimpleBridgeKitty.sol";

contract HomeMediator is BasicMediator {
    event Debug(uint256 requestGasLimit, address bridgeContract, address mediatorContractOnOtherSide);
    function passMessage(address _from, uint256 _tokenId, bytes _metadata) internal {
        bytes4 methodSelector = IForeignMediator(0).handleBridgedTokens.selector;

        bytes memory data = abi.encodeWithSelector(methodSelector, _from, _tokenId);

        bytes32 _messageId = bridgeContract().requireToPassMessage(
            mediatorContractOnOtherSide(),
            data,
            requestGasLimit()
        );

        setMessageTokenId(_messageId, _tokenId);
        setMessageRecipient(_messageId, _from);
        setMessageMetadata(_messageId, _metadata);
    }

    function handleBridgedTokens(address _recipient, uint256 _tokenId, bytes _metadata) external {
        require(msg.sender == address(bridgeContract()));
        require(bridgeContract().messageSender() == mediatorContractOnOtherSide());

        mintToken(_recipient, _tokenId, _metadata);
    }

    function mintToken(address _recipient, uint256 _tokenId, bytes _metadata) internal {
        ISimpleBridgeKitty(erc721token()).mint(
            _tokenId,
            getMetadataBoolValue(_metadata, 2), // isReady
            getMetadataUintValue(_metadata, 3), // cooldownIndex
            getMetadataUintValue(_metadata, 4), // nextActionAt
            getMetadataUintValue(_metadata, 5), // siringWithId
            getMetadataUintValue(_metadata, 6), // birthTime
            getMetadataUintValue(_metadata, 7), // matronId
            getMetadataUintValue(_metadata, 8), // sireId
            getMetadataUintValue(_metadata, 9), // generation
            getMetadataUintValue(_metadata, 10), // genes
            _recipient
        );
    }

    function bridgeSpecificActionsOnTokenTransfer(address _from, uint256 _tokenId) internal {
        bytes memory metadata = getMetadata(_tokenId);
        ISimpleBridgeKitty(erc721token()).burn(_tokenId);
        passMessage(_from, _tokenId, metadata);
    }

    function getMetadataUintValue(bytes _data, uint256 _index) internal pure returns (uint256 value) {
        uint256 offset = 32 * _index;
        assembly {
            value := mload(add(_data, offset))
        }
    }

    function getMetadataBoolValue(bytes _data, uint256 _index) internal pure returns (bool value) {
        uint256 offset = 32 * _index;
        assembly {
            value := mload(add(_data, offset))
        }
    }

    function setMessageMetadata(bytes32 _messageId, bytes _metadata) internal {
        bytesStorage[keccak256(abi.encodePacked("messageMetadata", _messageId))] = _metadata;
    }

    function messageMetadata(bytes32 _messageId) internal view returns (bytes) {
        return bytesStorage[keccak256(abi.encodePacked("messageMetadata", _messageId))];
    }

    function executeActionOnFixedTokens(address _recipient, uint256 _tokenId, bytes32 _messageId) internal {
        bytes memory metadata = messageMetadata(_messageId);
        mintToken(_recipient, _tokenId, metadata);
    }
}
