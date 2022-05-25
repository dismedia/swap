pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MercuryErc20 is ERC20 {
    constructor(uint256 initialSupply) ERC20("Mercury", "MRC") {
        _mint(msg.sender, initialSupply);
    }
}


