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

export const mintingContractAddress = "0xB5680e3E462F14F77b665D820097C5ec1445431A";

export function getMintingContractAddress(): string {
  return mintingContractAddress;
}

export function getMintingContract(): Contract {
  const signer = getEthersSigner();
  const contractAddress = getMintingContractAddress();
  const stakingContract = new ethers.Contract(
    contractAddress,
    mintingAbi,
    signer
  );
  return stakingContract;
}

function getAvinocTokenContract(): Contract {
  const signer = getEthersSigner();
  const avinocContract = new ethers.Contract(
    mintingContractAddress,
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

export interface MintingNft {
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
  const stakingContract = getMintingContract();
  const avinocContract = getAvinocTokenContract();
  const stakingContractAddress = getMintingContractAddress();
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
  const stakingContractAddress = getMintingContractAddress();
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
  | "ERROR_INSUFFICIENT_NRT";

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
  const stakingContract = getMintingContract();
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

  const stakingContract = getMintingContract();
  const txResponse = await stakingContract.claim(args.tokenIDs, {
    gasLimit, // in some cases the automatic gasLimit-estimation seems to fail
  });
  await waitForConfirmationOrThrow(txResponse);
  return null;
}

export async function fetchMintingNft(args: {
  tokenId: bigint;
}): Promise<MintingNft> {
  const stakingContract = getMintingContract();
  const rawMintingNft = await stakingContract.stakingNFTs(args.tokenId);
  const amount: bigint = rawMintingNft["amount"];
  const payoutFactor: bigint = rawMintingNft["payoutFactor"];
  const start = new Date(Number(rawMintingNft["start"]) * 1000);
  const end = new Date(Number(rawMintingNft["end"]) * 1000);
  const lastClaim = new Date(Number(rawMintingNft["lastClaim"]) * 1000);
  const years: bigint = BigInt(end.getFullYear() - start.getFullYear());
  const inprecisePayoutFactor = Number(payoutFactor) / 1e18;
  const apy = parseFloat(
    ((100 * (inprecisePayoutFactor - 1.0)) / Number(years)).toFixed(3)
  );

  const claimedRewards =
    (amount * payoutFactor * BigInt(lastClaim!.getTime() - start.getTime())) /
    (BigInt(end.getTime() - start.getTime()) * 10n ** 18n);

  const stakingNft: MintingNft = {
    tokenId: args.tokenId,
    amount,
    payoutFactor,
    claimedRewards,
    apy,
    start,
    end,
    lastClaim,
  };
  // console.log("rawMintingNft", rawMintingNft);
  // console.log("stakingNft", stakingNft);
  return stakingNft;
}

function getClaimFraction(stakingNft: MintingNft): bigint {
  return (
    (10n ** 18n * BigInt(Date.now() - stakingNft.lastClaim.getTime())) /
    BigInt(stakingNft.end.getTime() - stakingNft.start.getTime())
  );
}

export function computeUnclaimedRewards(stakingNft: MintingNft): bigint {
  return (
    (stakingNft.amount *
      stakingNft.payoutFactor *
      getClaimFraction(stakingNft)) /
    (10n ** 18n * 10n ** 18n)
  );
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
