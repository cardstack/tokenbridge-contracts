pragma solidity 0.5.5;

import "../libraries/ArbitraryMessage.sol";

contract MessageTest {
    function unpackData(bytes memory _data)
        public
        pure
        returns (
            bytes32 messageId,
            address sender,
            address executor,
            uint32 gasLimit,
            uint8 dataType,
            uint256[2] memory chainIds,
            bytes memory data
        )
    {
        (messageId, sender, executor, gasLimit, dataType, chainIds, data) = ArbitraryMessage.unpackData(_data);
    }

    function unpackDataWithExtraParams(
        bytes memory _data,
        bytes memory /*signatures*/
    )
        public
        pure
        returns (
            bytes32 messageId,
            address sender,
            address executor,
            uint32 gasLimit,
            uint8 dataType,
            uint256[2] memory chainIds,
            bytes memory data
        )
    {
        (messageId, sender, executor, gasLimit, dataType, chainIds, data) = ArbitraryMessage.unpackData(_data);
    }

}
