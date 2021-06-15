pragma solidity 0.4.24;
// nocommit rename
// nocommit ISimpleBridgeKitty

import "./BasicMediator.sol";
import "../interfaces/ISimpleBridgeKitty.sol";
import "../interfaces/IHomeMediator.sol";
import "../interfaces/IForeignMediator.sol";
import "../ERC721Proxy.sol";
import "openzeppelin-solidity/contracts/AddressUtils.sol";

contract HomeMediator is BasicMediator, IHomeMediator {
    function initialize(
        address _bridgeContract,
        address _mediatorContract,
        address _tokenImage,
        uint256 _requestGasLimit,
        address _owner
    ) external returns (bool) {
        _setTokenImage(_tokenImage);

        return super.initialize(_bridgeContract, _mediatorContract, _requestGasLimit, _owner);
    }

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
        // nocommit
        // setMessageTokenURI(_messageId, _tokenURI);
    }

    event NewTokenRegistered(address indexed foreignToken, address indexed homeToken);

    event Debug(string tag, string message);

    // token arrived from foreign network
    function handleBridgedTokens(
        address _tokenContractAddress,
        string _name,
        string _symbol,
        address _recipient,
        uint256 _tokenId,
        string _tokenURI
    ) external {
        require(msg.sender == address(bridgeContract()));
        require(bridgeContract().messageSender() == mediatorContractOnOtherSide());

        string memory name = _name;
        string memory symbol = _symbol;

        emit Debug("initial name", name);
        emit Debug("initial symbol", symbol);

        if (bytes(name).length == 0 && bytes(symbol).length == 0) {
            name = "<Unknown ERC721 Token>";
            symbol = "UNKNOWN.CPXD";
        }
        if (bytes(name).length == 0) {
            name = symbol;
        }
        if (bytes(symbol).length == 0) {
            symbol = name;
        }

        emit Debug("after name", name);
        emit Debug("after symbol", symbol);

        name = string(abi.encodePacked(name, ".CPXD"));

        emit Debug("cat name", name);

        address homeToken = new ERC721Proxy(tokenImage(), name, symbol, bridgeContract().sourceChainId());

        ERC721 deployedToken = ERC721(homeToken);

        emit Debug("dep name", deployedToken.name());
        emit Debug("dep symbol", deployedToken.symbol());

        _setTokenAddressPair(_tokenContractAddress, homeToken);

        emit NewTokenRegistered(_tokenContractAddress, homeToken);

        // TODO: check NFT support
        // IBridgeUtils bridgeUtilsInstance = IBridgeUtils(bridgeUtils());
        // bridgeUtilsInstance.addToken(homeToken);

        // _handleBridgedTokens(ERC677(homeToken), _recipient, _value);

        // emit NewTokenRegistered(_token, homeToken);

        // mintToken(_recipient, _tokenId, _metadata);

    }

    /**
    * @dev Internal function for updating an address of the token image contract.
    * @param _foreignToken address of bridged foreign token contract.
    * @param _foreignToken address of created home token contract.
    */
    function _setTokenAddressPair(address _foreignToken, address _homeToken) internal {
        addressStorage[keccak256(abi.encodePacked("hta", _foreignToken))] = _homeToken;
        addressStorage[keccak256(abi.encodePacked("fta", _homeToken))] = _foreignToken;
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

    function _setTokenImage(address _image) internal {
        require(AddressUtils.isContract(_image));
        addressStorage[keccak256(abi.encodePacked("tokenImage"))] = _image;
    }

    function tokenImage() internal view returns (address) {
        return addressStorage[keccak256(abi.encodePacked("tokenImage"))];
    }

}
