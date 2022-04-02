pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";

contract ERC721BurnableMintable is ERC721Token {
    string public constant version = "1";

    constructor(string memory _name, string memory _symbol) public ERC721Token(_name, _symbol) {
        _writeOwnerToStorageSlot(msg.sender);
    }

    /**
    * @dev Initialize the storage of the token. This is called instead of the constructor using a delegatecall
    * when the ERC721Proxy is deployed by the home bridge. This is required so that the proxy is deployed and
    * the initial storage data is correctly stored atomically at the sasme time
    * @param _name token name.
    * @param _symbol token symbol.
    */
    function initialize(string _name, string _symbol) public {
        require(owner() == address(0), "already initialized");

        _writeOwnerToStorageSlot(msg.sender); // msg.sender == HomeNftMediator
        name_ = _name;
        symbol_ = _symbol;
    }

    function owner() public view returns (address _owner) {
        assembly {
            _owner := sload(0x02016836a56b71f0d02689e69e326f4f4c1b9057164ef592671cf0d37c8040bf) // bytes32(uint256(keccak256("owner")) - 1)
        }

    }

    modifier onlyOwner() {
        require(msg.sender == owner());
        /* solcov ignore next */
        _;
    }

    function mint(address _to, uint256 _tokenId) external onlyOwner {
        _mint(_to, _tokenId);
    }

    function burn(address _owner, uint256 _tokenId) external onlyOwner {
        _burn(_owner, _tokenId);
    }

    function setTokenURI(uint256 _tokenId, string _newURI) external onlyOwner {
        _setTokenURI(_tokenId, _newURI);
    }

    event OwnershipTransferred(address previousOwner, address newOwner);

    function transferOwnership(address _newOwner) external onlyOwner {
        _setOwner(_newOwner);
    }

    function _setOwner(address newOwner) internal {
        require(newOwner != address(0));
        emit OwnershipTransferred(owner(), newOwner);
        _writeOwnerToStorageSlot(newOwner);
    }

    function _writeOwnerToStorageSlot(address owner) private {
        assembly {
            sstore(0x02016836a56b71f0d02689e69e326f4f4c1b9057164ef592671cf0d37c8040bf, owner) // bytes32(uint256(keccak256("owner")) - 1)
        }
    }

}
