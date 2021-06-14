pragma solidity 0.4.24;
import "../../../upgradeable_contracts/TransferInfoStorage.sol";
import "../../../interfaces/ERC721.sol";

contract ERC721Bridge is TransferInfoStorage {
    function erc721token(address _token) public view returns (ERC721) {
        return ERC721(_token);
    }
}
