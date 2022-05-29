pragma solidity ^0.8.0;


import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";


contract Swap is Ownable {

    uint256 private _rateAB;
    IERC20 public _tokenA;
    IERC20 public _tokenB;

    constructor(IERC20 tokenA, IERC20 tokenB, uint256 rateAB){

        _tokenA = tokenA;
        _tokenB = tokenB;
        setRate(rateAB);

    }


    function setRate(uint256 rateAB) public onlyOwner returns (bool){

        assert(rateAB > 0);
        _rateAB = rateAB;
        return true;
    }

    function deposit(IERC20 sourceTokenAddress, uint256 amount) public onlyOwner returns (bool){

        require(sourceTokenAddress == _tokenA || sourceTokenAddress == _tokenB, "cannot deposit, unknown token address");
        sourceTokenAddress.transferFrom(msg.sender, address(this), amount);
        return true;
    }


    function exchange(IERC20 sourceTokenAddress, uint256 amount) public returns (bool){


        require(sourceTokenAddress == _tokenA || sourceTokenAddress == _tokenB, "cannot swap, unknown token address");


        if (sourceTokenAddress == _tokenA) {


            uint256 b=10 ** 18 * amount / _rateAB;

            require(b <= _tokenB.balanceOf(address(this)), "not enough token deposited");
            require(amount <= _tokenA.allowance(msg.sender, address(this)), "not enough token user allowance");

            _tokenA.transferFrom(msg.sender, address(this), amount);
            _tokenB.transfer(msg.sender, b);


        } else {

            uint256 a=amount * _rateAB / 10 ** 18;

            require( a <= _tokenA.balanceOf(address(this)), "not enough token deposited");
            require(amount <= _tokenB.allowance(msg.sender, address(this)), "not enough token user allowance");

            _tokenB.transferFrom(msg.sender, address(this), amount);
            _tokenA.transfer(msg.sender, a);

        }

        return true;
    }

    function withdraw(IERC20 sourceTokenAddress, uint256 amount) public onlyOwner returns (bool){

        require(sourceTokenAddress == _tokenA || sourceTokenAddress == _tokenB, "cannot withdraw, unknown token address");
        sourceTokenAddress.transfer(owner(), amount);
        return true;
    }
}
