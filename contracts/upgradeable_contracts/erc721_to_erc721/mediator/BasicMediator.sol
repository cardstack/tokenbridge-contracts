pragma solidity 0.4.24;

import "../../../upgradeable_contracts/Initializable.sol";
import "../../../upgradeable_contracts/Claimable.sol";
import "../../../upgradeable_contracts/Upgradeable.sol";
import "../../../upgradeable_contracts/BasicAMBMediator.sol";

import "../../../libraries/Bytes.sol";
import "./ERC721Bridge.sol";

contract BasicMediator is Initializable, BasicAMBMediator, ERC721Bridge, Upgradeable, Claimable {
    event FailedMessageFixed(bytes32 indexed messageId, address recipient, uint256 tokenId);

    bytes4 internal constant GET_KITTY = 0xe98b7f4d; // getKitty(uint256)

    function initialize(
        address _bridgeContract,
        address _mediatorContract,
        address _erc721token,
        uint256 _requestGasLimit,
        address _owner
    ) external returns (bool) {
        require(!isInitialized());

        _setBridgeContract(_bridgeContract);
        _setMediatorContractOnOtherSide(_mediatorContract);
        setErc721token(_erc721token);
        _setRequestGasLimit(_requestGasLimit);
        _setOwner(_owner);
        setInitialize();

        return isInitialized();
    }

    function getBridgeInterfacesVersion() external pure returns (uint64 major, uint64 minor, uint64 patch) {
        return (1, 0, 0);
    }

    function getBridgeMode() external pure returns (bytes4 _data) {
        return bytes4(keccak256(abi.encodePacked("nft-to-nft-amb")));
    }

    function transferToken(address _from, uint256 _tokenId) external {
        ERC721 token = erc721token();
        address to = address(this);

        token.transferFrom(_from, to, _tokenId);
        bridgeSpecificActionsOnTokenTransfer(_from, _tokenId);
    }

    /**
    *  getKitty(uint256) returns:
    *       bool isGestating,
    *       bool isReady,
    *       uint256 cooldownIndex,
    *       uint256 nextActionAt,
    *       uint256 siringWithId,
    *       uint256 birthTime,
    *       uint256 matronId,
    *       uint256 sireId,
    *       uint256 generation,
    *       uint256 genes
    **/
    function getMetadata(uint256 _tokenId) internal view returns (bytes memory metadata) {
        bytes memory callData = abi.encodeWithSelector(GET_KITTY, _tokenId);
        address tokenAddress = erc721token();
        metadata = new bytes(320);
        assembly {
            let result := call(gas, tokenAddress, 0x0, add(callData, 0x20), mload(callData), 0, 0)
            returndatacopy(add(metadata, 0x20), 0, returndatasize)

            switch result
                case 0 {
                    revert(0, 0)
                }
        }
    }

    function setMessageTokenId(bytes32 _messageId, uint256 _tokenId) internal {
        uintStorage[keccak256(abi.encodePacked("messageToken", _messageId))] = _tokenId;
    }

    function setMessageRecipient(bytes32 _messageId, address _recipient) internal {
        addressStorage[keccak256(abi.encodePacked("messageRecipient", _messageId))] = _recipient;
    }

    function messageTokenId(bytes32 _messageId) internal view returns (uint256) {
        return uintStorage[keccak256(abi.encodePacked("messageToken", _messageId))];
    }

    function requestFailedMessageFix(bytes32 _txHash) external {
        require(!bridgeContract().messageCallStatus(_txHash));
        require(bridgeContract().failedMessageReceiver(_txHash) == address(this));
        require(bridgeContract().failedMessageSender(_txHash) == mediatorContractOnOtherSide());
        bytes32 dataHash = bridgeContract().failedMessageDataHash(_txHash);

        bytes4 methodSelector = this.fixFailedMessage.selector;
        bytes memory data = abi.encodeWithSelector(methodSelector, dataHash);
        bridgeContract().requireToPassMessage(mediatorContractOnOtherSide(), data, requestGasLimit());
    }

    function claimTokens(address _token, address _to) public onlyIfUpgradeabilityOwner validAddress(_to) {
        claimValues(_token, _to);
    }

    /**
    * @dev Handles the request to fix transferred assets which bridged message execution failed on the other network.
    * It uses the information stored by passMessage method when the assets were initially transferred
    * @param _messageId id of the message which execution failed on the other network.
    */
    function fixFailedMessage(bytes32 _messageId) public onlyMediator {
        require(!messageFixed(_messageId));
        address recipient = messageRecipient(_messageId);
        uint256 tokenId = messageTokenId(_messageId);
        setMessageFixed(_messageId);

        executeActionOnFixedTokens(recipient, tokenId, _messageId);
        emit FailedMessageFixed(_messageId, recipient, tokenId);

    }

    function executeActionOnFixedTokens(address _recipient, uint256 _tokenId, bytes32 _messageId) internal;

    function bridgeSpecificActionsOnTokenTransfer(address _from, uint256 _tokenId) internal;
}
