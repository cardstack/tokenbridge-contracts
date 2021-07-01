pragma solidity 0.4.24;

import "../upgradeable_contracts/erc20_to_erc20/HomeBridgeErcToErc.sol";

contract HomeBridgeErcToErcMock is HomeBridgeErcToErc {
    address public tokenImage;
    function setTokenImage(address _tokenImage) public {
        tokenImage = _tokenImage;
    }
}
