pragma solidity 0.4.24;

import "../../interfaces/IAMB.sol";
import "./MultiTokenBridgeMediator.sol";
import "../Ownable.sol";
import "../Initializable.sol";
import "../ReentrancyGuard.sol";
import "../Upgradeable.sol";
import "../Claimable.sol";
import "../VersionableBridge.sol";

/**
* @title BasicMultiAMBErc20ToErc677
* @dev Common functionality for multi-erc20-to-erc677 mediator intended to work on top of AMB bridge.
*/
contract BasicMultiAMBErc20ToErc677 is
    Initializable,
    ReentrancyGuard,
    Upgradeable,
    Claimable,
    MultiTokenBridgeMediator
{
    /**
    * @dev Tells the address of the mediator contract on the other side, used by chooseReceiver method
    * to avoid sending the native tokens to that address.
    * @return address of the mediator contract con the other side
    */
    function bridgeContractOnOtherSide() internal view returns (address) {
        return mediatorContractOnOtherSide();
    }

    /**
    * @dev Initiate the bridge operation for some amount of tokens from msg.sender.
    * The user should first call Approve method of the ERC677 token.
    * @param token bridged token contract address.
    * @param _receiver address that will receive the native tokens on the other network.
    * @param _value amount of tokens to be transferred to the other network.
    */
    function relayTokens(ERC677 token, address _receiver, uint256 _value) external {
        _relayTokens(token, _receiver, _value);
    }

    /**
    * @dev Initiate the bridge operation for some amount of tokens from msg.sender to msg.sender on the other side.
    * The user should first call Approve method of the ERC677 token.
    * @param token bridged token contract address.
    * @param _value amount of tokens to be transferred to the other network.
    */
    function relayTokens(ERC677 token, uint256 _value) external {
        _relayTokens(token, msg.sender, _value);
    }

    /**
    * @dev Claims stucked tokens. Only unsupported tokens can be claimed.
    * When dealing with already supported tokens, fixMediatorBalance can be used instead.
    * @param _token address of claimed token, address(0) for native
    * @param _to address of tokens receiver
    */
    function claimTokens(address _token, address _to) external onlyIfUpgradeabilityOwner {
        // Only unregistered tokens and native coins are allowed to be claimed with the use of this function
        require(_token == address(0) || !isTokenRegistered(_token));
        claimValues(_token, _to);
    }

    /* solcov ignore next */
    function onTokenTransfer(address _from, uint256 _value, bytes _data) public returns (bool);

    /* solcov ignore next */
    function _relayTokens(ERC677 token, address _receiver, uint256 _value) internal;

    /* solcov ignore next */
    function bridgeSpecificActionsOnTokenTransfer(ERC677 _token, address _from, uint256 _value, bytes _data) internal;
}
