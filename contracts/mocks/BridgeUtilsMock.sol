pragma solidity 0.4.24;

import "../interfaces/IBridgeUtils.sol";

contract BridgeUtilsMock is IBridgeUtils{
    address public safeMock;

    event UpdateToken(address token);
    event SupplierWallet(address owner, address wallet);

    struct Supplier {
        bool registered;
    }

    mapping(address => Supplier) public suppliers;

    constructor(address _safeMock) public {
        safeMock = _safeMock;
    }

    function registerSupplier(address ownerAddr) external returns(address) {
        suppliers[ownerAddr].registered = true;

        emit SupplierWallet(ownerAddr, safeMock);

        return safeMock;
    } 

    function updateToken(address tokenAddress) external returns(bool) {
        emit UpdateToken(tokenAddress);
        return true;
    }
}