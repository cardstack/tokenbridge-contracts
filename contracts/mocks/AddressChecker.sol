pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/AddressUtils.sol";

contract AddressChecker {
    function isContract(address _addr) external view returns (bool) {
        return AddressUtils.isContract(_addr);

    }
}
