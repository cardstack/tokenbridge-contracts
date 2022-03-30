pragma solidity 0.4.24;

import "../../upgradeability/Proxy.sol";
import "../../interfaces/IBridgeMediator.sol";

/**
* @title TokenProxy
* @dev Helps to reduces the size of the deployed bytecode for automatically created tokens, by using a proxy contract.
*/
contract TokenProxy is Proxy {
    // storage layout is copied from PermittableToken.sol
    string internal name;
    string internal symbol;
    uint8 internal decimals;
    mapping(address => uint256) internal balances;
    uint256 internal totalSupply;
    mapping(address => mapping(address => uint256)) internal allowed;
    address internal owner;
    bool internal mintingFinished;
    address internal bridgeContractAddr;
    // string public constant version = "1";
    // solhint-disable-next-line var-name-mixedcase
    bytes32 internal DOMAIN_SEPARATOR;
    // bytes32 public constant PERMIT_TYPEHASH = 0xea2aa0a1be11a07ed86d755c93467f4f82362b452371d1ba94d1715123511acb;
    mapping(address => uint256) internal nonces;
    mapping(address => mapping(address => uint256)) internal expirations;

    /**
    * @dev Creates a non-upgradeable token proxy for PermitableToken.sol, initializes its eternalStorage.
    * @param _tokenImage address of the token image used for mirroring all functions.
    * @param _name token name.
    * @param _symbol token symbol.
    * @param _decimals token decimals.
    */
    constructor(address _tokenImage, string memory _name, string memory _symbol, uint8 _decimals) public {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        owner = msg.sender; // msg.sender == HomeMultiAMBErc20ToErc677 mediator
        bridgeContractAddr = msg.sender;
    }

    /**
    * @dev Retrieves the implementation contract address, mirrored token image.
    * @return token image address.
    */
    function implementation() public view returns (address impl) {
        return IBridgeMediator(bridgeContractAddr).tokenImage();
    }
}
