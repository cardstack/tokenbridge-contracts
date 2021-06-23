pragma solidity 0.4.24;

import "../upgradeable_contracts/erc721_to_erc721/ERC721BurnableMintable.sol";

contract UpdatedERC721ImageMock is ERC721BurnableMintable {
    function foo(uint256 _tokenId) public view returns (string) {
        return tokenURI(_tokenId);
    }
}
