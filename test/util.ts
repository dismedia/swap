import {BigNumber, BigNumberish} from "ethers";

export const numToWei=(n:BigNumberish)=>BigNumber.from("1000000000000000000").mul(n);
export const weiToNum=(b:BigNumber)=>b.div(BigNumber.from("1000000000000000000"));