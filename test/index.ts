import { expect } from "chai";
import { ethers } from "hardhat";

describe("Greeter", function () {
  it("Should return the new greeting once it's changed", async function () {
    const Greeter = await ethers.getContractFactory("Greeter");
    const greeter = await Greeter.deploy("Hello, world!");
    await greeter.deployed();

    expect(await greeter.greet()).to.equal("Hello, world!");

    const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    await setGreetingTx.wait();

    expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});


describe("ERC20", function () {
  it("should run carbon & mercury", async function () {
    const [owner,  ...addrs] = await ethers.getSigners();

    const carbonErc20Contract = await ethers.getContractFactory("CarbonErc20");
    const mercuryErc20Contract = await ethers.getContractFactory("MercuryErc20");
    const carbon = await carbonErc20Contract.deploy(100);
    const mercury = await mercuryErc20Contract.deploy(101);


    const carbonOwnerBalance = await carbon.balanceOf(owner.address);
    const mercuryOwnerBalance = await mercury.balanceOf(owner.address);

    expect(await carbon.totalSupply()).to.equal(carbonOwnerBalance);
    expect(await mercury.totalSupply()).to.equal(mercuryOwnerBalance);


  });


});

describe("Swap", function () {
  it("should be able to run", async function () {
    const [owner,  ...addrs] = await ethers.getSigners();


    const carbonErc20Contract = await ethers.getContractFactory("CarbonErc20");
    const mercuryErc20Contract = await ethers.getContractFactory("MercuryErc20");
    const swapContract = await ethers.getContractFactory("Swap");


    const carbon = await carbonErc20Contract.deploy(100);
    const mercury = await mercuryErc20Contract.deploy(101);


    const swap = await swapContract.deploy(carbon.address,mercury.address);

    expect(true).to.equal(true);

  });


});