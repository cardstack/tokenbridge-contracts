pragma solidity 0.4.24;

import "../../upgradeability/Proxy.sol";
import "openzeppelin-solidity/contracts/AddressUtils.sol";

import "../../interfaces/IBridgeMediator.sol";

/**
* @title TokenProxy
* @dev Helps to reduces the size of the deployed bytecode for automatically created tokens, by using a proxy contract.
*/
contract ERC721Proxy is Proxy {
    bytes4 internal constant INITIALIZE = 0x4cd88b76; // bytes4(keccak256("initialize(string,string)"))

    /**
    * @dev Creates an upgradeable token proxy for ERC721BurnableMintable.sol, initializes its storage by using delegatecall
    * @param _name token name.
    * @param _symbol token symbol.
    */
    constructor(address _tokenImage, string memory _name, string memory _symbol) public {
        bool result = _tokenImage.delegatecall(abi.encodeWithSelector(INITIALIZE, _name, _symbol));
        require(result, "failed to initialize token storage");
    }

    /**
    * @dev Retrieves the implementation contract address, mirrored token image.
    * @return token image address.
    */
    function implementation() public view returns (address) {
        return IBridgeMediator(owner()).tokenImage();
    }

    function owner() public view returns (address _owner) {
        assembly {
            _owner := sload(0x02016836a56b71f0d02689e69e326f4f4c1b9057164ef592671cf0d37c8040bf) // bytes32(uint256(keccak256("owner")) - 1)
        }

    }

}
