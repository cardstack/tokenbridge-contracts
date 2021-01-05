pragma solidity 0.4.24;

// Mock of https://github.com/cardstack/card-protocol-xdai/blob/bridge-utils-contract/smart-contract-xdai/contracts/BridgeUtils.sol

contract BridgeUtilsMock {
    event UpdateToken(address token);
    event SupplierWallet(address owner, address wallet);

    struct Supplier {
        bool registered;
    }

    mapping(address => Supplier) public suppliers;

    function registerSupplier(address ownerAddr) external returns (address) {
        address fakeSafe = _arbitraryAddress();
        suppliers[fakeSafe].registered = true;

        emit SupplierWallet(ownerAddr, fakeSafe);

        return fakeSafe;
    }

    function isRegistered(address supplierAddr) public view returns (bool) {
        return suppliers[supplierAddr].registered;
    }

    // just an arbitrary address that could theoretically be a safe
    function _arbitraryAddress() internal returns (address) {
        return address(0x379A38A225fadb4a3769391aB26E2440681BF098);
    }

    function updateToken(address tokenAddr) external returns (bool) {
        emit UpdateToken(tokenAddr);
        return true;
    }
}
