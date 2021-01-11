pragma solidity 0.5.5;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC677 is ERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value, bytes data);

    function transferAndCall(address, uint, bytes memory) public returns (bool) ;
}

contract LegacyERC20 {
    function transfer(address _spender, uint256 _value) public; // returns (bool);
    function transferFrom(address _owner, address _spender, uint256 _value) public; // returns (bool);
}
