pragma solidity 0.4.24;

import "../upgradeable_contracts/erc20_to_erc20/HomeBridgeErcToErc.sol";
import "../upgradeable_contracts/multi_amb_erc20_to_erc677/TokenProxy.sol";
import "../upgradeable_contracts/erc721_to_erc721/ERC721Proxy.sol";

contract HomeBridgeErcToErcMock is HomeBridgeErcToErc {
    address public tokenImage;
    function setTokenImage(address _tokenImage) public {
        tokenImage = _tokenImage;
    }

    event TokenProxyDeployed(address proxy);

    function deployTokenProxy(string _name, string _symbol, uint8 decimals) public returns (address _proxy) {
        require(tokenImage != address(0), "tokenImage not set");
        _proxy = new TokenProxy(tokenImage, _name, _symbol, decimals);

        emit TokenProxyDeployed(_proxy);
    }

    function deployTokenProxyERC721(string _name, string _symbol) public returns (address _proxy) {
        require(tokenImage != address(0), "tokenImage not set");
        _proxy = new ERC721Proxy(tokenImage, _name, _symbol);

        emit TokenProxyDeployed(_proxy);
    }

}
