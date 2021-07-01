pragma solidity 0.4.24;

import "../upgradeable_contracts/native_to_erc20/ForeignBridgeNativeToErc.sol";

contract ForeignBridgeNativeToErcMock is ForeignBridgeNativeToErc {
    address public tokenImage;
    function setTokenImage(address _tokenImage) public onlyOwner {
        tokenImage = _tokenImage;
    }
}
