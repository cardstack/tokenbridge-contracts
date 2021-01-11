pragma solidity 0.4.24;

import "../interfaces/IBridgeUtils.sol";

contract BridgeUtilsMock is IBridgeUtils{
    address public safeMock;

    constructor(address _safeMock) public {
        safeMock = _safeMock;
    }

    function registerSupplier(address safeWallet) external returns(address) {
        return safeMock;
    }

    function updateToken(address) external returns(bool) {
        return true;
    }
}