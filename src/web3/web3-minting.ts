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
  "0xB5680e3E462F14F77b665D820097C5ec1445431A";
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
  toClaim: (numberOfNFTs: bigint) => {
    return 150000n + (numberOfNFTs - 1n) * 25000n;
  },
};

export interface MintingNft {
  tokenId: bigint;
  mintingPower: bigint;
  stakedTokens: bigint;
  totalRewards: bigint;
  claimedRewards: bigint;
  lastClaimedTimestamp: Date;
  endTime: Date;
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
  | "ERROR_INSUFFICIENT_NRT";

export async function submitMintingTx(args: {
  mintingPlan: MintingPlan;
  ethAddress: string;
}): Promise<StakeError | null> {
  if (!isFallbackModeActive() && !(await isWalletBackupAvailable())) {
    return "ERROR_MISSING_WALLET_BACKUP";
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

  const stakingContract = getMintingContract();
  const txResponse = await stakingContract.claim(args.tokenIDs, {
    gasLimit, // in some cases the automatic gasLimit-estimation seems to fail
  });
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
    lastClaimedTimestamp: new Date(
      Number(rawMintingNft["lastClaimedTimestamp"]) * 1000
    ),
    endTime: new Date(Number(rawMintingNft["endTime"]) * 1000),
  };
  console.log("mintingNFT", mintingNFT);
  return mintingNFT;
}

export function computeUnclaimedRewards(mintingNft: MintingNft): bigint {
  return (mintingNft.totalRewards * 60n / 100n) - mintingNft.claimedRewards;
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
