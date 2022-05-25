pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CarbonErc20 is ERC20 {
    constructor(uint256 initialSupply) ERC20("Carbon", "CRB") {
        _mint(msg.sender, initialSupply);
    }
}


