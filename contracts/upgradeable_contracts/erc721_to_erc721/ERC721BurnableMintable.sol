pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";

contract ERC721BurnableMintable is ERC721Token {
    // solhint-disable-next-line const-name-snakecase
    string public constant version = "1";
    // solhint-disable-next-line const-name-snakecase
    uint256 public ___deprecated___chainId;
    address public owner;

    constructor(string memory _name, string memory _symbol) public ERC721Token(_name, _symbol) {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
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
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

}
