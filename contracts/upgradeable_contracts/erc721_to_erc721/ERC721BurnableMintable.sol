pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";

contract ERC721BurnableMintable is ERC721Token {
    string public constant version = "1";
    uint256 public chainId;
    address internal owner;
    address internal bridgeContractAddr;

    constructor(string memory _name, string memory _symbol, uint256 _chainId) public ERC721Token(_name, _symbol) {
        require(_chainId != 0);
        owner = msg.sender;
        chainId = chainId;
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

}
