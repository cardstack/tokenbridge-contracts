pragma solidity 0.4.24;
import "./BasicNftMediator.sol";
import "../../../libraries/TokenReader.sol";
import "openzeppelin-solidity/contracts/AddressUtils.sol";
import "../interfaces/IForeignNftMediator.sol";
import "../interfaces/IHomeNftMediator.sol";

contract ForeignNftMediator is IForeignNftMediator, BasicNftMediator {
    using SafeERC721 for ERC721;

    function passMessage(address _tokenContract, address _from, uint256 _tokenId) internal {
        string memory tokenURI = TokenReader.readTokenURI(_tokenContract, _tokenId);
        string memory name = TokenReader.readName(_tokenContract);
        string memory symbol = TokenReader.readSymbol(_tokenContract);

        bytes4 methodSelector = IHomeNftMediator(0).handleBridgedTokens.selector;
        bytes memory data = abi.encodeWithSelector(
            methodSelector,
            _tokenContract,
            name,
            symbol,
            _from,
            _tokenId,
            tokenURI
        );
        bytes32 _messageId = bridgeContract().requireToPassMessage(
            mediatorContractOnOtherSide(),
            data,
            requestGasLimit()
        );
        setMessageTokenContract(_messageId, _tokenContract);
        setMessageTokenId(_messageId, _tokenId);
        setMessageRecipient(_messageId, _from);
        setMessageTokenURI(_messageId, tokenURI);
    }

    // token bridged from home network
    function handleBridgedTokens(address _recipient, address _tokenContract, uint256 _tokenId) external {
        require(AddressUtils.isContract(_tokenContract));
        require(msg.sender == address(bridgeContract()));
        require(bridgeContract().messageSender() == mediatorContractOnOtherSide());
        erc721token(_tokenContract).safeTransferFrom(this, _recipient, _tokenId);
    }

    // received token to bridge to home network
    function bridgeSpecificActionsOnTokenTransfer(address _tokenContract, address _from, uint256 _tokenId) internal {
        passMessage(_tokenContract, _from, _tokenId);
    }

    // *
    // * @dev Unlock back the amount of tokens that were bridged to the other network but failed.
    // * @param _token address that bridged token contract.
    // * @param _recipient address that will receive the tokens.
    // * @param _value amount of tokens to be received.

    function executeActionOnFixedTokens(
        address _recipient,
        address _tokenContract,
        uint256 _tokenId,
        bytes32 /* _messageId */
    ) internal {
        erc721token(_tokenContract).safeTransferFrom(this, _recipient, _tokenId);
    }
}
