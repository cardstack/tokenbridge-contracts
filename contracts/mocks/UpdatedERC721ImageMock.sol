pragma solidity 0.4.24;

import "../upgradeable_contracts/erc721_to_erc721/ERC721BurnableMintable.sol";

contract UpdatedERC721ImageMock is ERC721BurnableMintable {
    constructor(string memory _name, string memory _symbol, uint256 _chainId)
        public
        ERC721BurnableMintable(_name, _symbol, _chainId)
    {
        // solhint-disable-previous-line no-empty-blocks
    }

    function foo(uint256 _tokenId) public view returns (string) {
        return tokenURI(_tokenId);
    }
}
