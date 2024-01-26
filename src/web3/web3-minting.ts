import { ethers } from "ethers";
import React from "react";
import genericErc20Abi from "@/contracts/erc20.json";
import {
  checkIfGasCanBePaid,
  getEthersSigner,
  isWalletBackupAvailable,
  waitForConfirmationOrThrow,
  Web3Error,
} from "@/web3/web3-common";
import { Contract } from "ethers";
import { isFallbackModeActive } from "nomo-webon-kit";
import { mintingAbi } from "@/contracts/minting-abi";
import { MintingOperation, MintingPlan } from "./minting-plan";

export const mintingContractAddress =
  "0x1bCF9e51e77aA11cE363BA2a836F045E2B8e4066";
export const nrtTokenContractAddress =
  "0xEdF221F8C1957b6aC950430836e7aa0d7Db5b4dA";

export function getMintingContract(): Contract {
  const signer = getEthersSigner();
  const stakingContract = new ethers.Contract(
    mintingContractAddress,
    mintingAbi,
    signer
  );
  return stakingContract;
}

function getNrtTokenContract(): Contract {
  const signer = getEthersSigner();
  const tokenContract = new ethers.Contract(
    nrtTokenContractAddress,
    genericErc20Abi,
    signer
  );
  return tokenContract;
}

const gasLimits = {
  toApprove: 60000n,
  toStake: 280000n,
  toClaim: () => {
    return 150000n;
  },
};

export interface MintingNft {
  tokenId: bigint;
  mintingPower: bigint;
  stakedTokens: bigint;
  totalRewards: bigint;
  claimedRewards: bigint;
  lastClaimedTimestamp: Date;
  lifeCycleDuration: Date;
  endTime: Date;
  quantity: bigint;
}

async function approveIfNecessary(args: {
  nrtAmount: bigint;
  ethAddress: string;
}): Promise<{ nonce: number }> {
  const signer = getEthersSigner();
  const tokenContract = getNrtTokenContract();
  const allowance: bigint = await tokenContract.allowance(
    args.ethAddress,
    mintingContractAddress
  );
  const nonce = await signer.getNonce();
  console.log("allowance", allowance);
  if (args.nrtAmount > allowance) {
    const txApprove = await tokenContract.approve(
      mintingContractAddress,
      ethers.MaxUint256,
      {
        gasLimit: gasLimits.toApprove,
      }
    );
    console.log("txApprove", txApprove);
    return { nonce: nonce + 1 };
  } else {
    console.log("skip approve tx");
    return { nonce };
  }
}

export type StakeError =
  | Web3Error
  | "ERROR_INSUFFICIENT_RESERVES"
  | "ERROR_LIMIT_EXCEEDED"
  | "ERROR_NO_POWER_NRT_POWER_NODES"
  | "ERROR_INSUFFICIENT_NRT";

export async function submitMintingTx(args: {
  mintingPlan: MintingPlan;
  ethAddress: string;
  nrtBalance: bigint;
}): Promise<StakeError | null> {
  if (!isFallbackModeActive() && !(await isWalletBackupAvailable())) {
    return "ERROR_MISSING_WALLET_BACKUP";
  }

  if (!args.mintingPlan.totalAmountToLink) {
    return "ERROR_NO_POWER_NRT_POWER_NODES";
  }
  if (args.mintingPlan.totalAmountToLink > args.nrtBalance) {
    return "ERROR_INSUFFICIENT_NRT";
  }

  const totalGasLimit = gasLimits.toApprove + gasLimits.toStake;
  const gasError = await checkIfGasCanBePaid({
    ethAddress: args.ethAddress,
    gasLimit: totalGasLimit,
  });
  if (gasError) {
    return gasError;
  }

  let { nonce } = await approveIfNecessary({
    nrtAmount: args.mintingPlan.totalAmountToLink,
    ethAddress: args.ethAddress,
  });
  for (const mintingOp of args.mintingPlan.mintingOps) {
    await submitMintintOp({ mintingOp, nonce });
    nonce++;
  }

  return null;
}

async function submitMintintOp(args: {
  mintingOp: MintingOperation;
  nonce: number;
}): Promise<void> {
  const mintingOp = args.mintingOp;
  const mintingContract = getMintingContract();
  const txMint = await mintingContract.stake(
    mintingOp.amountToLink,
    mintingOp.nft.tokenId,
    {
      gasLimit: gasLimits.toStake, // for the case that a gasLimit cannot be automatically estimated
      nonce: args.nonce,
    }
  );
  await waitForConfirmationOrThrow(txMint);
}

export async function submitClaimTransaction(args: {
  tokenID: bigint;
  ethAddress: string;
}): Promise<"ERROR_INSUFFICIENT_ETH" | null> {
  const gasLimit = gasLimits.toClaim();
  const gasError = await checkIfGasCanBePaid({
    ethAddress: args.ethAddress,
    gasLimit,
  });
  if (gasError) {
    return gasError;
  }

  const stakingContract = getMintingContract();
  const txResponse = await stakingContract.claimRewards(args.tokenID);
  await waitForConfirmationOrThrow(txResponse);
  return null;
}

export async function fetchNftDetails(args: {
  tokenId: bigint;
}): Promise<MintingNft> {
  const mintingContract = getMintingContract();
  const rawMintingNft = await mintingContract.stakingNFTs(args.tokenId);

  const mintingNFT: MintingNft = {
    tokenId: args.tokenId,
    mintingPower: rawMintingNft["mintingPower"],
    stakedTokens: rawMintingNft["stakedTokens"],
    totalRewards: rawMintingNft["totalRewards"],
    claimedRewards: rawMintingNft["claimedRewards"],
    lifeCycleDuration: new Date(
      Number(rawMintingNft["lifeCycleDuration"]) * 1000
    ),
    lastClaimedTimestamp: new Date(
      Number(rawMintingNft["lastClaimedTimestamp"]) * 1000
    ),
    endTime: new Date(Number(rawMintingNft["endTime"]) * 1000),
    quantity: rawMintingNft["quantity"],
  };
  console.log("mintingNFT", mintingNFT);
  return mintingNFT;
}

export function getCurrentDay(mintingNft: MintingNft): number {
  const startTime =
    mintingNft.endTime.getTime() - mintingNft.lifeCycleDuration.getTime();
  const currentTime = new Date().getTime();
  return (currentTime - startTime) / (1000 * 60 * 60 * 24);
}

export function getLifeCycleDays(mintingNft: MintingNft): bigint {
  const lifeCycleDuration = mintingNft.lifeCycleDuration;
  if (Number.isNaN(lifeCycleDuration.getTime())) {
    return 720n;
  }

  const lifeCycleDays =
    BigInt(lifeCycleDuration.getTime()) / (1000n * 60n * 60n * 24n);
  return lifeCycleDays;
}

export function computeUnclaimedRewards(mintingNft: MintingNft): bigint {
  const endTime = BigInt(mintingNft.endTime.getTime());
  const startTime = endTime - BigInt(mintingNft.lifeCycleDuration.getTime());
  const currentTime = BigInt(new Date().getTime());

  const totalRewards: bigint =
    (mintingNft.stakedTokens * mintingNft.mintingPower) / 100n;
  const claimableRewards =
    ((currentTime - startTime) * totalRewards) / (endTime - startTime);
  return claimableRewards - mintingNft.claimedRewards;
}

export function useNrtBalance(args: { ethAddress: string | null }): {
  nrtBalance: bigint | null;
  fetchError: Error | null;
} {
  const [nrtBalance, setNrtBalance] = React.useState<bigint | null>(null);
  const [fetchError, setFetchError] = React.useState<Error | null>(null);
  React.useEffect(() => {
    if (args.ethAddress) {
      fetchNrtBalance(args.ethAddress);
    }
  }, [args.ethAddress]);

  async function fetchNrtBalance(ethAddress: string) {
    const tokenContract = getNrtTokenContract();
    try {
      const balance = await tokenContract.balanceOf(ethAddress);
      console.log("fetched nrtBalance", ethAddress, balance.toString());
      setNrtBalance(balance);
    } catch (e) {
      setFetchError(e as Error);
      console.error(e);
    }
  }
  return { nrtBalance: nrtBalance, fetchError };
}
