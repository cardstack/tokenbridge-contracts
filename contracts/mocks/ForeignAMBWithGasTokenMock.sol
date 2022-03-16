pragma solidity 0.4.24;

import "../upgradeable_contracts/arbitrary_message/ForeignAMBWithGasToken.sol";

/**
* @title ForeignAMBWithGasTokenMock
* @dev Wrapper on ForeignAMB contract, which supports minting gas tokens while passing messages
*/
contract ForeignAMBWithGasTokenMock is ForeignAMBWithGasToken {
    address public gasTokenAddress;

    function gasToken() public view returns (IGasToken) {
        // Address generated in unit test, also hardcoded in GasTokenMock
        return IGasToken(gasTokenAddress);
    }

    function collectGasTokens() external {
        _collectGasTokens();
    }

    function setGasToken(address _gasTokenAddress) external {
        gasTokenAddress = _gasTokenAddress;
    }
}
