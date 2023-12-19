import { ethers } from "ethers";
import StakingABI from "@/contracts/Staking.json";
import React from "react";
import genericErc20Abi from "@/contracts/erc20.json";
import {
  checkIfGasCanBePaid,
  getEthersSigner,
  isWalletBackupAvailable,
  waitForConfirmationOrThrow,
  Web3Error,
} from "@/web3/web3-common";
import { getNomoEvmNetwork } from "./navigation";
import { Contract } from "ethers";
import { invokeNomoFunction, isFallbackModeActive } from "nomo-webon-kit";

export const avinocContractAddress =
  "0xf1ca9cb74685755965c7458528a36934df52a3ef"; // has the same address on both ERC20 and ZEN20

export function getStakingContractAddress(): string {
  const ethStakingContract = "0x7561DEAf4ECf96dc9F0d50B4136046979ACdAD3e";
  const smartChainStakingContract =
    "0x97F51eCDeEdecdb740DD1ff6236D013aFff0417d";

  const network = getNomoEvmNetwork();
  if (network === "ethereum") {
    return ethStakingContract;
  } else if (network === "zeniq-smart-chain") {
    return smartChainStakingContract;
  } else {
    throw Error("unsupported network " + network);
  }
}

export function getStakingContract(): Contract {
  const signer = getEthersSigner();
  const contractAddress = getStakingContractAddress();
  const stakingContract = new ethers.Contract(
    contractAddress,
    StakingABI.abi,
    signer
  );
  return stakingContract;
}

function getAvinocTokenContract(): Contract {
  const signer = getEthersSigner();
  const avinocContract = new ethers.Contract(
    avinocContractAddress,
    genericErc20Abi,
    signer
  );
  return avinocContract;
}

const gasLimits = {
  toApprove: 60000n,
  toStake: 280000n,
  toClaim: (numberOfNFTs: bigint) => {
    return 150000n + (numberOfNFTs - 1n) * 25000n;
  },
};

export interface StakingNft {
  tokenId: bigint;
  amount: bigint;
  payoutFactor: bigint;
  claimedRewards: bigint;
  apy: number;
  start: Date;
  end: Date;
  lastClaim: Date;
}

async function checkAvinocReserves(args: {
  avinocAmount: bigint;
}): Promise<StakeError | null> {
  const stakingContract = getStakingContract();
  const avinocContract = getAvinocTokenContract();
  const stakingContractAddress = getStakingContractAddress();
  const [remainingPayout, remainingBurn, aviBalance] = await Promise.all([
    stakingContract.remainingPayout(),
    stakingContract.remainingBurn(),
    avinocContract.balanceOf(stakingContractAddress),
  ]);
  const remainingReserves = aviBalance - remainingPayout - remainingBurn;
  if (remainingReserves < (args.avinocAmount * 11n) / 10n) {
    return "ERROR_INSUFFICIENT_RESERVES";
  } else {
    return null;
  }
}

async function approveIfNecessary(args: {
  avinocAmount: bigint;
  ethAddress: string;
}) {
  const avinocContract = getAvinocTokenContract();
  const stakingContractAddress = getStakingContractAddress();
  const allowance: bigint = await avinocContract.allowance(
    args.ethAddress,
    stakingContractAddress
  );
  console.log("allowance", allowance);
  if (args.avinocAmount > allowance) {
    const txApprove = await avinocContract.approve(
      stakingContractAddress,
      ethers.MaxUint256,
      {
        gasLimit: gasLimits.toApprove,
      }
    );
    console.log("txApprove", txApprove);
  } else {
    console.log("skip approve tx");
  }
}

export type StakeError =
  | Web3Error
  | "ERROR_INSUFFICIENT_RESERVES"
  | "ERROR_LIMIT_EXCEEDED"
  | "ERROR_INSUFFICIENT_AVINOC";

export async function submitStakeTransaction(args: {
  years: bigint;
  avinocAmount: bigint;
  safirSig: string | null;
  ethAddress: string;
}): Promise<StakeError | null> {
  if (!isFallbackModeActive() && !(await isWalletBackupAvailable())) {
    return "ERROR_MISSING_WALLET_BACKUP";
  }

  const reserveError = await checkAvinocReserves({
    avinocAmount: args.avinocAmount,
  });
  if (reserveError) {
    return reserveError;
  }
  const totalGasLimit = gasLimits.toApprove + gasLimits.toStake;
  const gasError = await checkIfGasCanBePaid({
    ethAddress: args.ethAddress,
    gasLimit: totalGasLimit,
  });
  if (gasError) {
    return gasError;
  }

  await approveIfNecessary({
    avinocAmount: args.avinocAmount,
    ethAddress: args.ethAddress,
  });

  // const safir_avinoc_address = "0x176c066F77BE7C320f8378C4E24fFee3a8c8172a";
  // const bonusSigExampleDevWallet =
  //   "0x2db5eaa08e1b09c50ce6625ed3c2d259fefeb40d51c7c8a9dffae3986a11c528524da168622c776bf179fc81a20f2742a8552ed0b8bea9df4c017f25809424251b";
  const bonusSigs = args.safirSig ? [args.safirSig] : [];
  const stakingContract = getStakingContract();
  const txStake = await stakingContract.stake(
    args.years,
    args.avinocAmount,
    bonusSigs,
    {
      gasLimit: gasLimits.toStake, // for the case that a gasLimit cannot be automatically estimated
    }
  );
  await waitForConfirmationOrThrow(txStake);
  return null;
}

export async function submitClaimTransaction(args: {
  tokenIDs: Array<bigint>;
  ethAddress: string;
}): Promise<"ERROR_INSUFFICIENT_ETH" | null> {
  const gasLimit = gasLimits.toClaim(BigInt(args.tokenIDs.length));
  const gasError = await checkIfGasCanBePaid({
    ethAddress: args.ethAddress,
    gasLimit,
  });
  if (gasError) {
    return gasError;
  }

  const stakingContract = getStakingContract();
  const txResponse = await stakingContract.claim(args.tokenIDs, {
    gasLimit, // in some cases the automatic gasLimit-estimation seems to fail
  });
  await waitForConfirmationOrThrow(txResponse);
  return null;
}

export async function fetchStakingNft(args: {
  tokenId: bigint;
}): Promise<StakingNft> {
  const stakingContract = getStakingContract();
  const rawStakingNft = await stakingContract.stakingNFTs(args.tokenId);
  const amount: bigint = rawStakingNft["amount"];
  const payoutFactor: bigint = rawStakingNft["payoutFactor"];
  const start = new Date(Number(rawStakingNft["start"]) * 1000);
  const end = new Date(Number(rawStakingNft["end"]) * 1000);
  const lastClaim = new Date(Number(rawStakingNft["lastClaim"]) * 1000);
  const years: bigint = BigInt(end.getFullYear() - start.getFullYear());
  const inprecisePayoutFactor = Number(payoutFactor) / 1e18;
  const apy = parseFloat(
    ((100 * (inprecisePayoutFactor - 1.0)) / Number(years)).toFixed(3)
  );

  const claimedRewards =
    (amount * payoutFactor * BigInt(lastClaim!.getTime() - start.getTime())) /
    (BigInt(end.getTime() - start.getTime()) * 10n ** 18n);

  const stakingNft: StakingNft = {
    tokenId: args.tokenId,
    amount,
    payoutFactor,
    claimedRewards,
    apy,
    start,
    end,
    lastClaim,
  };
  // console.log("rawStakingNft", rawStakingNft);
  // console.log("stakingNft", stakingNft);
  return stakingNft;
}

function getClaimFraction(stakingNft: StakingNft): bigint {
  return (
    (10n ** 18n * BigInt(Date.now() - stakingNft.lastClaim.getTime())) /
    BigInt(stakingNft.end.getTime() - stakingNft.start.getTime())
  );
}

export function computeUnclaimedRewards(stakingNft: StakingNft): bigint {
  return (
    (stakingNft.amount *
      stakingNft.payoutFactor *
      getClaimFraction(stakingNft)) /
    (10n ** 18n * 10n ** 18n)
  );
}

export function useSafirAvinocSig(): {
  safirSig: string | null;
} {
  const [sigObject, setSigObject] = React.useState<Record<
    string,
    string
  > | null>(null);
  React.useEffect(() => {
    getSafirAvinocSig();
  }, []);

  async function getSafirAvinocSig() {
    try {
      const safirPubKey =
        "0483739a0844d78c72b77f0ca24f51d390daf8f212122052e3bd4b3b591f0d43ba";
      const name = "SAFIR-AVINOC";
      const sigObject = await invokeNomoFunction("getValueFromNomoID", {
        pubKeyHex: safirPubKey,
        name,
      });
      console.log("sigObject", sigObject);
      setSigObject(sigObject);
    } catch (e) {
      console.error(e);
    }
  }
  const safirSig = sigObject ? sigObject["data"] : null;
  return { safirSig };
}

export function useAvinocBalance(args: { ethAddress: string | null }): {
  avinocBalance: bigint | null;
  fetchError: Error | null;
} {
  const [avinocBalance, setAvinocBalance] = React.useState<bigint | null>(null);
  const [fetchError, setFetchError] = React.useState<Error | null>(null);
  React.useEffect(() => {
    if (args.ethAddress) {
      fetchAvinocBalance(args.ethAddress);
    }
  }, [args.ethAddress]);

  async function fetchAvinocBalance(ethAddress: string) {
    const avinocContract = getAvinocTokenContract();
    try {
      const balance = await avinocContract.balanceOf(ethAddress);
      console.log("fetched avincocBalance", ethAddress, balance.toString());
      setAvinocBalance(balance);
    } catch (e) {
      setFetchError(e as Error);
      console.error(e);
    }
  }
  return { avinocBalance, fetchError };
}
