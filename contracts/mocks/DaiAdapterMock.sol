pragma solidity 0.5.5;

contract DaiAdapterMock {
    address public dai;

    constructor(address _dai) public {
        dai = _dai;
    }
}
