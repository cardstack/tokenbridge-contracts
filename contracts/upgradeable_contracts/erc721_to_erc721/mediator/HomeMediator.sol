pragma solidity 0.4.24;
// nocommit rename
// nocommit ISimpleBridgeKitty

import "./BasicMediator.sol";
import "../interfaces/ISimpleBridgeKitty.sol";
import "../interfaces/IHomeMediator.sol";
import "../interfaces/IForeignMediator.sol";
import "../ERC721Proxy.sol";
import "openzeppelin-solidity/contracts/AddressUtils.sol";

interface TokenInterface {
    // nocommit tidy this up, maybe remove and fix inheritance
    function totalSupply() public view returns (uint256 total);
    function balanceOf(address _owner) public view returns (uint256 balance);
    function ownerOf(uint256 _tokenId) external view returns (address owner);
    function approve(address _to, uint256 _tokenId) external;
    function transfer(address _to, uint256 _tokenId) external;
    function transferFrom(address _from, address _to, uint256 _tokenId) external;
    function name() public view returns (string name);
    function symbol() public view returns (string symbol);
    function tokenURI(uint256 _tokenId) public view returns (string);

    function mint(address _to, uint256 _tokenId) external;
    function burn(address _owner, uint256 _tokenId) external;
    function setTokenURI(uint256 _tokenId, string memory _newURI);
}

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

    function passMessage(address _from, address _tokenContract, uint256 _tokenId, string _tokenURI) internal {
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
        setMessageTokenURI(_messageId, _tokenURI);
    }

    event NewTokenRegistered(address indexed foreignToken, address indexed homeToken);

    // nocommit
    event Debug(string tag, string message);

    // token arrived from foreign network
    function handleBridgedTokens(
        address _foreignTokenAddress,
        string _name,
        string _symbol,
        address _recipient,
        uint256 _tokenId,
        string _tokenURI
    ) external {
        require(msg.sender == address(bridgeContract()));
        require(bridgeContract().messageSender() == mediatorContractOnOtherSide());

        address homeTokenAddress = this.homeTokenAddress(_foreignTokenAddress);

        if (homeTokenAddress != address(0)) {
            // a token from this contract has been bridged before
            _mintToken(TokenInterface(homeTokenAddress), _recipient, _tokenId, _tokenURI);
            return;
        }

        string memory name = _name;
        string memory symbol = _symbol;

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

        name = string(abi.encodePacked(name, ".CPXD"));

        homeTokenAddress = new ERC721Proxy(tokenImage(), name, symbol, bridgeContract().sourceChainId());

        _setTokenAddressPair(_foreignTokenAddress, homeTokenAddress);

        emit NewTokenRegistered(_foreignTokenAddress, homeTokenAddress);

        _mintToken(TokenInterface(homeTokenAddress), _recipient, _tokenId, _tokenURI);
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

    /**
    * @dev Retrieves address of the home bridged token contract associated with a specific foreign token contract.
    * @param _foreignToken address of the created home token contract.
    * @return address of the home token contract.
    */
    function homeTokenAddress(address _foreignToken) public view returns (address) {
        return addressStorage[keccak256(abi.encodePacked("hta", _foreignToken))];
    }

    /**
    * @dev Retrieves address of the foreign bridged token contract associated with a specific home token contract.
    * @param _homeToken address of the created home token contract.
    * @return address of the foreign token contract.
    */
    function foreignTokenAddress(address _homeToken) public view returns (address) {
        return addressStorage[keccak256(abi.encodePacked("fta", _homeToken))];
    }

    function _mintToken(TokenInterface _token, address _recipient, uint256 _tokenId, string _tokenURI) internal {
        _token.mint(_recipient, _tokenId);
        _token.setTokenURI(_tokenId, _tokenURI);
    }

    // received a token to burn and bridge back to the foreign network
    function bridgeSpecificActionsOnTokenTransfer(address _tokenContract, address _from, uint256 _tokenId) internal {
        TokenInterface token = TokenInterface(_tokenContract);
        string memory tokenURI = token.tokenURI(_tokenId);
        token.burn(this, _tokenId);
        passMessage(_from, _tokenContract, _tokenId, tokenURI);
        // function passMessage(address _from, address _tokenContract, uint256 _tokenId, bytes _metadata) internal {

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
