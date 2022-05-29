import {expect} from "chai";
import {ethers} from "hardhat";
import {CarbonErc20, CarbonErc20Interface} from "../typechain-types/CarbonErc20";
import {ERC20, ERC20Interface} from "../typechain-types/ERC20";
import {MercuryErc20, Swap} from "../typechain-types";
import {BigNumber, FixedNumber} from "ethers";
import {numToWei} from "./util";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import show = Mocha.reporters.Base.cursor.show;

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


const prepare = async () => {

    const carbonErc20ContractFactory = await ethers.getContractFactory("CarbonErc20");
    const mercuryErc20ContractFactory = await ethers.getContractFactory("MercuryErc20");
    const swapContract = await ethers.getContractFactory("Swap");
    const [owner, user, ...users] = await ethers.getSigners();

    const carbon = await carbonErc20ContractFactory.deploy(numToWei(100)) as CarbonErc20;
    const mercury = await mercuryErc20ContractFactory.deploy(numToWei(100)) as MercuryErc20;
    const swap = await swapContract.deploy(carbon.address, mercury.address, numToWei(2)) as Swap

    const assertBalances = balancesAssertionFactory(carbon, mercury)(swap, user)
    const assertAllowance = allowanceAssertionFactory(carbon, mercury, swap)(owner, user)


    return {carbon, mercury, swap, assertBalances, assertAllowance, owner, user, users}


}



describe("Swap", function () {


    it("should throw when deposit is invoked with non A or B address",async ()=>{

        const {swap, owner} = await prepare()

        const carbonErc20ContractFactory = await ethers.getContractFactory("CarbonErc20");
        const unknownErc20 = await carbonErc20ContractFactory.deploy(numToWei(100));


        await unknownErc20.connect(owner).increaseAllowance(swap.address, numToWei(5));
        await expect(swap.connect(owner).deposit(unknownErc20.address, numToWei(1))).to.be.revertedWith("cannot deposit, unknown token address")

    })

    it("should throw when exchange is invoked with non A or B address",async ()=>{

        const {swap, user} = await prepare()

        const carbonErc20ContractFactory = await ethers.getContractFactory("CarbonErc20");
        const unknownErc20 = await carbonErc20ContractFactory.deploy(numToWei(100));
        await expect(swap.connect(user).exchange(unknownErc20.address,numToWei(1))).to.be.revertedWith("cannot swap, unknown token address")

    })

    it("should not be able to swap if its not enough balance deposited",async ()=>{

        const {carbon, mercury, swap, assertBalances, assertAllowance, owner, user} = await prepare()

        await carbon.connect(owner).transfer(user.address, numToWei(10));
        await mercury.connect(owner).increaseAllowance(swap.address, numToWei(5))
        await swap.connect(owner).deposit(mercury.address, numToWei(1));

        await assertBalances({
            carbonBalances: {swap: 0, user: 10}, mercuryBalance: {user: 0, swap: 1}
        })

        //set allowance for user
        await carbon.connect(user).increaseAllowance(swap.address, numToWei(10))

        await assertAllowance({
            carbonAllowance: {user: 10}, mercuryAllowance: {user: 0}
        })

        //do a swap
        await expect(swap.connect(user).exchange(carbon.address, numToWei(10))).to.be.revertedWith("not enough token deposited")


    })
    it("should not be able to swap if its not enough user allowance",async ()=>{

        const {carbon, mercury, swap, assertBalances, assertAllowance, owner, user} = await prepare()

        await carbon.connect(owner).transfer(user.address, numToWei(10));
        await mercury.connect(owner).increaseAllowance(swap.address, numToWei(10))
        await swap.connect(owner).deposit(mercury.address, numToWei(10));

        await assertBalances({
            carbonBalances: {swap: 0, user: 10}, mercuryBalance: {user: 0, swap: 10}
        })

        //set allowance for user
        await carbon.connect(user).increaseAllowance(swap.address, numToWei(9))

        await assertAllowance({
            carbonAllowance: {user: 9}, mercuryAllowance: {user: 0}
        })

        //do a swap
        await expect(swap.connect(user).exchange(carbon.address, numToWei(10))).to.be.revertedWith("not enough token user allowance")


    })


    it("should be able to swap A to B", async function () {

        const {carbon, mercury, swap, assertBalances, assertAllowance, owner, user} = await prepare()

        await carbon.connect(owner).transfer(user.address, numToWei(10));
        await mercury.connect(owner).increaseAllowance(swap.address, numToWei(5))
        await swap.connect(owner).deposit(mercury.address, numToWei(5));


        //initial balances assertion (in 10**18 unit)
        await assertBalances({
            carbonBalances: {swap: 0, user: 10}, mercuryBalance: {user: 0, swap: 5}
        })

        //set allowances
        await carbon.connect(user).increaseAllowance(swap.address, numToWei(10))

        await assertAllowance({
            carbonAllowance: {user: 10}, mercuryAllowance: {user: 0}
        })

        //do a swap
        await swap.connect(user).exchange(carbon.address, numToWei(10));

        await assertBalances({
            carbonBalances: {swap: 10, user: 0}, mercuryBalance: {user: 5, swap: 0}
        })

        await assertAllowance({
            carbonAllowance: {user: 0}, mercuryAllowance: {user: 0,}
        })


    });

    it("should be able to swap B to A", async function () {

        const {carbon, mercury, swap, assertBalances, assertAllowance, owner, user} = await prepare()


        await mercury.connect(owner).transfer(user.address, numToWei(10));


        await carbon.connect(owner).increaseAllowance(swap.address, numToWei(20))
        await swap.connect(owner).deposit(carbon.address, numToWei(20));


        //initial balances assertion (in 10**18 unit)
        await assertBalances({
            carbonBalances: {swap: 20, user: 0}, mercuryBalance: {user: 10, swap: 0}
        })

        //set allowances
        await mercury.connect(user).increaseAllowance(swap.address, numToWei(10))


        await assertAllowance({
            carbonAllowance: {user: 0}, mercuryAllowance: {user: 10,}
        })


        //do a swap
        await swap.connect(user).exchange(mercury.address, numToWei(10));


        await assertBalances({
            carbonBalances: {swap: 0, user: 20}, mercuryBalance: {user: 0, swap: 10}
        })


        await assertAllowance({
            carbonAllowance: {user: 0}, mercuryAllowance: {user: 0,}
        })


    });

    it("should be able to  with changed rate and both directions", async function () {

        const {carbon, mercury, swap, assertBalances, assertAllowance, owner, user} = await prepare()

        await carbon.connect(owner).transfer(user.address, numToWei(10));
        await mercury.connect(owner).increaseAllowance(swap.address, numToWei(10))
        await carbon.connect(owner).increaseAllowance(swap.address, numToWei(10))
        await swap.connect(owner).deposit(carbon.address, numToWei(10));
        await swap.connect(owner).deposit(mercury.address, numToWei(10));


        //initial balances assertion (in 10**18 unit)
        await assertBalances({
            carbonBalances: {swap: 10, user: 10}, mercuryBalance: {user: 0, swap: 10}
        })

        //set allowances
        await carbon.connect(user).increaseAllowance(swap.address, numToWei(10))


        await assertAllowance({
            carbonAllowance: {user: 10}, mercuryAllowance: {user: 0,}
        })


        //do a swap:A->B rateAB 2
        await swap.connect(user).exchange(carbon.address, numToWei(2)); //B:1
        await assertBalances({
            carbonBalances: {swap: 12, user: 8}, mercuryBalance: {user: 1, swap: 9}
        })


        //do a swap:A->B rateAB 0.5
        await swap.connect(owner).setRate(numToWei(BigNumber.from(1)).div(2));
        await swap.connect(user).exchange(carbon.address, numToWei(2));
        await assertBalances({
            carbonBalances: {swap: 14, user: 6}, mercuryBalance: {user: 5, swap: 5}
        })

        //do a swap:B->A rateAB 0.2
        await swap.connect(owner).setRate(numToWei(BigNumber.from(1)).div(5));
        await mercury.connect(user).increaseAllowance(swap.address, numToWei(5))
        await carbon.connect(owner).increaseAllowance(swap.address, numToWei(1))

        await swap.connect(user).exchange(mercury.address, numToWei(5));
        await assertBalances({
            carbonBalances: {swap: 13, user: 7}, mercuryBalance: {user: 0, swap: 10}
        })


    })
    it("should be able to withdraw valid balances, for owner", async()=>{

        const {carbon, mercury, swap, assertBalances, assertAllowance, owner, user} = await prepare()

        await carbon.connect(owner).transfer(user.address, numToWei(10));
        await mercury.connect(owner).increaseAllowance(swap.address, numToWei(10))
        await carbon.connect(owner).increaseAllowance(swap.address, numToWei(10))
        await swap.connect(owner).deposit(carbon.address, numToWei(10));
        await swap.connect(owner).deposit(mercury.address, numToWei(10));


        //initial balances assertion (in 10**18 unit)
        await assertBalances({
            carbonBalances: {swap: 10, user: 10}, mercuryBalance: {user: 0, swap: 10}
        })

        //set allowances
        await carbon.connect(user).increaseAllowance(swap.address, numToWei(10))


        await assertAllowance({
            carbonAllowance: {user: 10}, mercuryAllowance: {user: 0,}
        })


        //do a swap:A->B rateAB 2
        await swap.connect(user).exchange(carbon.address, numToWei(2)); //B:1
        await assertBalances({
            carbonBalances: {swap: 12, user: 8}, mercuryBalance: {user: 1, swap: 9}
        })






        await swap.connect(owner).withdraw(carbon.address, numToWei(5));
        await swap.connect(owner).withdraw(mercury.address, numToWei(5));

        await assertBalances({
            carbonBalances: {swap: 7, user: 8}, mercuryBalance: {user: 1, swap: 4}
        })

        expect(await carbon.balanceOf(owner.address)).to.equal(numToWei(85));
        expect(await mercury.balanceOf(owner.address)).to.equal(numToWei(95));


        await expect(swap.connect(user).withdraw(carbon.address,numToWei(4))).to.revertedWith("Ownable: caller is not the owner")


    })


});