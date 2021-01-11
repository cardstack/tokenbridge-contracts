pragma solidity 0.5.5;

contract Sacrifice {
    constructor(address payable _recipient) public payable {
        selfdestruct(_recipient);
    }
}
