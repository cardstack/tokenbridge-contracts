pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/AddressUtils.sol";
import "./interfaces/IBurnableMintableERC677Token.sol";
import "./upgradeable_contracts/Claimable.sol";

/**
* @title ERC677BridgeToken
* @dev The basic implementation of a bridgeable ERC677-compatible token
*/
contract ERC677BridgeToken is IBurnableMintableERC677Token, DetailedERC20, BurnableToken, MintableToken, Claimable {
    bytes4 internal constant ON_TOKEN_TRANSFER = 0xa4c0ed36; // onTokenTransfer(address,uint256,bytes)

    address public bridgeContractAddr;

    // solhint-disable-next-line const-name-snakecase
    string public constant version = "2";

    // The constructor is only used when this token is used in tests as a generic token.
    // In the live token bridge, this is deployed as a proxy and the initialize method is used.
    constructor(string _name, string _symbol, uint8 _decimals) public DetailedERC20(_name, _symbol, _decimals) {
        owner = msg.sender;
        bridgeContractAddr = msg.sender;
    }

    /**
    * @dev Initialize the storage of the token. This is called instead of the constructor using a delegatecall
    * when the TokenProxy is deployed by the home bridge. This is required so that the bridgeContractAddr is
    * correctly stored in the right storage slot, as the proxy does not know the storage slots to store the
    * address and other params in
    * @param _name token name.
    * @param _symbol token symbol.
    * @param _decimals token decimals.
    */
    function initialize(string _name, string _symbol, uint8 _decimals) public {
        // It is unfortunate that the owner / bridgeContractAddr has two seperate storage slots -
        // they will always be the same, we do not update the bridge address, this is
        // legacy holdover but both should be set to ensure that the bridge contract
        // is able to handle the token appropriately

        require(owner == address(0), "already initialized");
        require(bridgeContractAddr == address(0), "already initialized");

        owner = msg.sender; // msg.sender == HomeMultiAMBErc20ToErc677 mediator
        bridgeContractAddr = msg.sender;

        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }

    modifier validRecipient(address _recipient) {
        require(_recipient != address(0) && _recipient != address(this));
        _;
    }

    function transferAndCall(address _to, uint256 _value, bytes _data) external validRecipient(_to) returns (bool) {
        require(super.transfer(_to, _value));
        emit Transfer(msg.sender, _to, _value, _data);

        if (AddressUtils.isContract(_to)) {
            executeTokenTransferCallback(_to, msg.sender, _value, _data);
        }
        return true;
    }

    /**
     * @dev ERC20 transfer function, with the exception of also calling the onTokenTransfer callback in the one case
     * of the recipient being the token bridge. This means that bridged tokens sent back to the bridge via a wallet
     * UI will be bridged (to the same address on the foreign network) instead of stuck in the bridge
     * @param _to tokens receiver
     * @param _value amount of tokens that was sent
     */
    function transfer(address _to, uint256 _value) public returns (bool) {
        require(super.transfer(_to, _value));

        if (isBridge(_to)) {
            executeTokenTransferCallback(_to, msg.sender, _value, new bytes(0));
        }

        return true;
    }

    function isBridge(address _address) public view returns (bool) {
        return _address == bridgeContractAddr;
    }

    /**
     * @dev call onTokenTransfer fallback on the token recipient contract
     * @param _contract the contract that has the callback
     * @param _from tokens sender
     * @param _value amount of tokens that was sent
     * @param _data set of extra bytes that can be passed to the recipient
     */
    function executeTokenTransferCallback(address _contract, address _from, uint256 _value, bytes _data) private {
        require(_contract.call(abi.encodeWithSelector(ON_TOKEN_TRANSFER, _from, _value, _data)));
    }

    // We don't really need this as there is already a "version" constant but implementing it lets blockscout detect
    // bridged tokens.
    // https://docs.tokenbridge.net/eth-xdai-amb-bridge/multi-token-extension/the-bridged-tokens-list/token-list-compilation
    // Add 10000 to the constant version to avoid conflicts with existing bridged token versions, the interface of
    // this implementation has been slimmed down a lot to reduce api surface area

    function getTokenInterfacesVersion() external pure returns (uint64 major, uint64 minor, uint64 patch) {
        return (10002, 0, 0);
    }

    function finishMinting() public returns (bool) {
        revert();
    }

    function renounceOwnership() public onlyOwner {
        revert();
    }

    /**
     * @dev Withdraws the erc20 tokens or native coins from this contract.
     * @param _token address of the claimed token or address(0) for native coins.
     * @param _to address of the tokens/coins receiver.
     */
    function claimTokens(address _token, address _to) external onlyOwner {
        claimValues(_token, _to);
    }
}
