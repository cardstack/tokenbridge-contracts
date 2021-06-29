pragma solidity 0.4.24;

import "../../upgradeability/Proxy.sol";
import "openzeppelin-solidity/contracts/AddressUtils.sol";

import "../../interfaces/IBridgeMediator.sol";

/**
* @title TokenProxy
* @dev Helps to reduces the size of the deployed bytecode for automatically created tokens, by using a proxy contract.
*/
contract ERC721Proxy is Proxy {
    // storage layout is copied from ERC721BurnableMintable.sol

    // SupportsInterfaceWithLookup
    mapping(bytes4 => bool) internal supportedInterfaces;

    // ERC721BasicToken
    mapping(uint256 => address) internal tokenOwner;
    mapping(uint256 => address) internal tokenApprovals;
    mapping(address => uint256) internal ownedTokensCount;
    mapping(address => mapping(address => bool)) internal operatorApprovals;

    // ERC721Token
    string internal name_;
    string internal symbol_;
    mapping(address => uint256[]) internal ownedTokens;
    mapping(uint256 => uint256) internal ownedTokensIndex;
    uint256[] internal allTokens;
    mapping(uint256 => uint256) internal allTokensIndex;
    mapping(uint256 => string) internal tokenURIs;

    //  ERC721BurnableMintable
    uint256 public chainId;
    address internal owner;

    /**
    * @dev Creates an upgradeable token proxy for PermitableToken.sol, initializes its eternalStorage.
    * @param _name token name.
    * @param _symbol token symbol.
    * @param _chainId chain id for current network.
    */
    constructor(string memory _name, string memory _symbol, uint256 _chainId) public {
        name_ = _name;
        symbol_ = _symbol;
        owner = msg.sender; // msg.sender == ERC721 HomeNftMediator
    }

    /**
    * @dev Retrieves the implementation contract address, mirrored token image.
    * @return token image address.
    */
    function implementation() public view returns (address impl) {
        return IBridgeMediator(owner).tokenImage();
    }

}
