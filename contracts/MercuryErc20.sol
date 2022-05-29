pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MercuryErc20 is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("Mercury", "MRC") {
        _mint(msg.sender, initialSupply);
    }

    function mint(address account, uint256 amount) public onlyOwner returns (bool) {
        _mint(account, amount);
        return true;
    }
}


