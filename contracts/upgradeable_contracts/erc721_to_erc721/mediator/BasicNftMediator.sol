pragma solidity 0.4.24;

import "../../../upgradeable_contracts/Initializable.sol";
import "../../../upgradeable_contracts/Claimable.sol";
import "../../../upgradeable_contracts/Upgradeable.sol";
import "../../../upgradeable_contracts/BasicAMBMediator.sol";

import "../../../libraries/Bytes.sol";
import "./ERC721Bridge.sol";
import "../../../interfaces/ERC721.sol";
import "../../../libraries/SafeERC721.sol";

contract BasicNftMediator is Initializable, BasicAMBMediator, ERC721Bridge, Upgradeable, Claimable {
    using SafeERC721 for ERC721;

    event FailedMessageFixed(bytes32 indexed messageId, address recipient, address tokenContract, uint256 tokenId);

    function initialize(address _bridgeContract, address _mediatorContract, uint256 _requestGasLimit, address _owner)
        public
        returns (bool)
    {
        require(!isInitialized());

        _setBridgeContract(_bridgeContract);
        _setMediatorContractOnOtherSide(_mediatorContract);
        _setRequestGasLimit(_requestGasLimit);
        _setOwner(_owner);
        setInitialize();

        return isInitialized();
    }

    function getBridgeInterfacesVersion() external pure returns (uint64 major, uint64 minor, uint64 patch) {
        return (1, 0, 0);
    }

    function getBridgeMode() external pure returns (bytes4 _data) {
        return bytes4(keccak256(abi.encodePacked("multi-nft-to-nft-amb")));
    }

    function transferToken(address _tokenContract, address _from, uint256 _tokenId) external {
        ERC721 token = erc721token(_tokenContract);
        address to = address(this);
        token.safeTransferFrom(_from, to, _tokenId);
        bridgeSpecificActionsOnTokenTransfer(_tokenContract, _from, _tokenId);
    }

    function setMessageTokenId(bytes32 _messageId, uint256 _tokenId) internal {
        uintStorage[keccak256(abi.encodePacked("messageToken", _messageId))] = _tokenId;
    }

    function setMessageTokenContract(bytes32 _messageId, address _tokenContract) internal {
        addressStorage[keccak256(abi.encodePacked("messageTokenContract", _messageId))] = _tokenContract;
    }

    function setMessageTokenURI(bytes32 _messageId, string _tokenURI) internal {
        stringStorage[keccak256(abi.encodePacked("messageTokenURI", _messageId))] = _tokenURI;
    }

    function setMessageRecipient(bytes32 _messageId, address _recipient) internal {
        addressStorage[keccak256(abi.encodePacked("messageRecipient", _messageId))] = _recipient;
    }

    function messageTokenId(bytes32 _messageId) internal view returns (uint256) {
        return uintStorage[keccak256(abi.encodePacked("messageToken", _messageId))];
    }

    function messageTokenURI(bytes32 _messageId) internal view returns (string) {
        return stringStorage[keccak256(abi.encodePacked("messageTokenURI", _messageId))];
    }

    function messageTokenContract(bytes32 _messageId) internal view returns (address) {
        return addressStorage[keccak256(abi.encodePacked("messageTokenContract", _messageId))];
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
        address tokenContract = messageTokenContract(_messageId);
        uint256 tokenId = messageTokenId(_messageId);
        setMessageFixed(_messageId);

        executeActionOnFixedTokens(recipient, tokenContract, tokenId, _messageId);
        emit FailedMessageFixed(_messageId, recipient, tokenContract, tokenId);

    }

    function executeActionOnFixedTokens(
        address _recipient,
        address _tokenContract,
        uint256 _tokenId,
        bytes32 _messageId
    ) internal;

    function bridgeSpecificActionsOnTokenTransfer(address _tokenContract, address _from, uint256 _tokenId) internal;
}
