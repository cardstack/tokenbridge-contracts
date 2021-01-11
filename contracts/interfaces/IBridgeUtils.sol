pragma solidity 0.4.24;

interface IBridgeUtils {
    function registerSupplier(address safeWallet) external returns(address);
    function updateToken(address token) external returns(bool);
}