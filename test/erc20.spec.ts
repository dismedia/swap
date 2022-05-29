import {expect} from "chai";
import {ethers} from "hardhat";
import {CarbonErc20, CarbonErc20Interface} from "../typechain-types/CarbonErc20";
import {ERC20, ERC20Interface} from "../typechain-types/ERC20";
import {MercuryErc20, Swap} from "../typechain-types";
import {BigNumber, FixedNumber} from "ethers";
import {numToWei} from "./util";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

const balancesAssertionFactory = (carbon: CarbonErc20, mercury: MercuryErc20) =>
    (swap: Swap, user: SignerWithAddress,) =>
        async (balances: { carbonBalances: { user: number, swap: number }, mercuryBalance: { user: number, swap: number } }) => {

            expect(await carbon.balanceOf(user.address)).to.equal(numToWei(balances.carbonBalances.user), "invalid carbon:user balance");
            expect(await carbon.balanceOf(swap.address)).to.equal(numToWei(balances.carbonBalances.swap), "invalid carbon:swap balance");
            expect(await mercury.balanceOf(user.address)).to.equal(numToWei(balances.mercuryBalance.user), "invalid mercury:user balance");
            expect(await mercury.balanceOf(swap.address)).to.equal(numToWei(balances.mercuryBalance.swap), "invalid mercury:swap balance");
        }


const allowanceAssertionFactory = (carbon: CarbonErc20, mercury: MercuryErc20, swap: Swap) =>
    (owner: SignerWithAddress, user: SignerWithAddress) =>
        async (allowances: { carbonAllowance: { user: number, }, mercuryAllowance: { user: number, } }) => {

            expect(await carbon.allowance(user.address, swap.address)).to.equal(numToWei(allowances.carbonAllowance.user), "invalid carbon:user allowance");
            expect(await mercury.allowance(user.address, swap.address)).to.equal(numToWei(allowances.mercuryAllowance.user), "invalid mercury:user allowance");

        }


describe("ERC20", function () {
    it("should run/mint carbon & mercury erc20 ", async function () {
        const [owner, user, ...addrs] = await ethers.getSigners();

        const carbonErc20ContractFactory = await ethers.getContractFactory("CarbonErc20");
        const mercuryErc20ContractFactory = await ethers.getContractFactory("MercuryErc20");


        const carbon = await carbonErc20ContractFactory.deploy(numToWei(100)) as CarbonErc20;
        const mercury = await mercuryErc20ContractFactory.deploy(numToWei(102)) as MercuryErc20;

        await carbon.connect(owner).transfer(user.address, numToWei(50));
        expect(await carbon.balanceOf(user.address)).to.equal(numToWei(50));

        await carbon.connect(owner).mint(user.address, numToWei(9));
        await mercury.connect(owner).mint(user.address, numToWei(9));

        expect(await carbon.balanceOf(user.address)).to.equal(numToWei(59));
        expect(await mercury.balanceOf(user.address)).to.equal(numToWei(9));


    });


});

