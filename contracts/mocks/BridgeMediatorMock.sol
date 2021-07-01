pragma solidity 0.4.24;

import "../upgradeable_contracts/multi_amb_erc20_to_erc677/TokenProxy.sol";

contract BridgeMediatorMock {
    address private tokenImplAddress;
    address public deployedToken;

    constructor(address _tokenImplAddress) public {
        tokenImplAddress = _tokenImplAddress;
    }

    function tokenImage() public view returns (address) {
        return tokenImplAddress;
    }

    event DeployedProxy(address proxy);
    function deployProxy(string memory _name, string memory _symbol, uint8 _decimals, uint256 _chainId) public {
        deployedToken = new TokenProxy(tokenImplAddress, _name, _symbol, _decimals, _chainId);
        emit DeployedProxy(deployedToken);
    }

}
