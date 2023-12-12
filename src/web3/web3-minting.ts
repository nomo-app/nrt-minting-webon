import { ethers } from "ethers";
import StakingABI from "@/contracts/Staking.json";
import React from "react";
import genericErc20Abi from "@/contracts/erc20.json";
import {
  bigNumberToNumber,
  checkIfGasCanBePaid,
  ethProvider,
  isWalletBackupAvailable,
  waitForConfirmationOrThrow,
  Web3Error,
} from "@/web3/web3-common";
import { fetchWithRetryEtherScan } from "@/util/util";

const stakingContractAddress = "0x7561DEAf4ECf96dc9F0d50B4136046979ACdAD3e";
const avinocContractAddress = "0xf1ca9cb74685755965c7458528a36934df52a3ef";

const stakingContract = new ethers.Contract(
  stakingContractAddress,
  StakingABI.abi,
  ethProvider
);
const avinocContract = new ethers.Contract(
  avinocContractAddress,
  genericErc20Abi,
  ethProvider
);

const gasLimits = {
  toApprove: 60000n,
  toStake: 280000n,
  toClaim: (numberOfNFTs: bigint) => {
    return 150000n + (numberOfNFTs - 1n) * 25000n;
  },
};

export interface StakingNft {
  tokenId: number;
  amount: number;
  payoutFactor: number;
  claimedRewards: number;
  apy: number;
  start: Date;
  end: Date;
  lastClaim: Date;
}

async function checkAvinocReserves(args: {
  avinocAmount: number;
}): Promise<StakeError | null> {
  const [remainingPayout, remainingBurn, aviBalance] = await Promise.all([
    stakingContract.remainingPayout(),
    stakingContract.remainingBurn(),
    avinocContract.balanceOf(stakingContractAddress),
  ]);
  const remainingReserves =
    bigNumberToNumber(aviBalance) / 1e18 -
    bigNumberToNumber(remainingPayout) / 1e18 -
    bigNumberToNumber(remainingBurn) / 1e18;
  if (remainingReserves < args.avinocAmount * 1.1) {
    return "ERROR_INSUFFICIENT_RESERVES";
  } else {
    return null;
  }
}

async function approveIfNecessary(args: {
  avinocAmount: bigint;
  ethAddress: string;
}) {
  const allowanceBN = await avinocContract.allowance(
    args.ethAddress,
    stakingContractAddress
  );
  const allowance = bigNumberToNumber(allowanceBN);
  console.log("allowance", allowance);
  if (bigNumberToNumber(args.avinocAmount) > allowance) {
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
  years: number;
  avinocAmount: number;
  safirSig: string | null;
  ethAddress: string;
}): Promise<StakeError | null> {
  if (!(await isWalletBackupAvailable())) {
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

  const avinocAmount = ethers.parseEther("" + args.avinocAmount);
  await approveIfNecessary({
    avinocAmount,
    ethAddress: args.ethAddress,
  });

  // const safir_avinoc_address = "0x176c066F77BE7C320f8378C4E24fFee3a8c8172a";
  // const bonusSigExampleDevWallet =
  //   "0x2db5eaa08e1b09c50ce6625ed3c2d259fefeb40d51c7c8a9dffae3986a11c528524da168622c776bf179fc81a20f2742a8552ed0b8bea9df4c017f25809424251b";
  const bonusSigs = args.safirSig ? [args.safirSig] : [];
  const txStake = await stakingContract.stake(
    args.years,
    avinocAmount,
    bonusSigs,
    {
      gasLimit: gasLimits.toStake, // for the case that a gasLimit cannot be automatically estimated
    }
  );
  await waitForConfirmationOrThrow(txStake);
  return null;
}

export async function submitClaimTransaction(args: {
  tokenIDs: Array<number>;
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

  const txResponse = await stakingContract.claim(args.tokenIDs, {
    gasLimit, // in some cases the automatic gasLimit-estimation seems to fail
  });
  await waitForConfirmationOrThrow(txResponse);
  return null;
}

async function fetchTokenIDCandidatesFromEtherscan(args: {
  ethAddress: string;
}): Promise<Array<number>> {
  // https://docs.etherscan.io/getting-started/endpoint-urls
  const etherScanNFTEndpoint =
    "https://api.etherscan.io/api?module=account&action=tokennfttx&contractaddress=" +
    stakingContractAddress +
    "&address=" +
    args.ethAddress +
    "&page=1&offset=100&startblock=0&endblock=27025780&sort=asc";

  const result = await fetchWithRetryEtherScan({ url: etherScanNFTEndpoint });
  if (!Array.isArray(result)) {
    throw Error("did not receive tokenIDs from etherscan");
  }
  return result.map((r) => parseInt(r.tokenID)).filter((tokenId) => !!tokenId);
}

export async function fetchOwnedTokenIDs(args: {
  ethAddress: string;
}): Promise<Array<number>> {
  try {
    const idCandidates = await fetchTokenIDCandidatesFromEtherscan(args);
    const ownerOfPromises = idCandidates.map((idCandidate) =>
      stakingContract.ownerOf(idCandidate)
    );
    console.log("received idCandidates from etherscan", idCandidates);
    const ownerOfArray: string[] = await Promise.all(ownerOfPromises);
    console.log("received owners of idCandidates", ownerOfArray);
    return idCandidates.filter(
      (idCandidate, index) =>
        ownerOfArray[index].toLowerCase() === args.ethAddress.toLowerCase()
    );
  } catch (e) {
    console.error(e);
  }
  return await fetchOwnedTokenIDsByEnumeratingAllTokens(args);
}

async function fetchOwnedTokenIDsByEnumeratingAllTokens(args: {
  ethAddress: string;
}): Promise<Array<number>> {
  const totalNumberOfNFTs = bigNumberToNumber(
    await stakingContract.totalNFTs()
  );
  const maxBatchSize = 10;

  const tokenIDs: Array<number> = [];
  let idCandidate = 1;
  while (idCandidate < totalNumberOfNFTs) {
    const batchSize = Math.min(totalNumberOfNFTs - idCandidate, maxBatchSize);
    const promiseArray = [];
    const idCandidateArray = [];
    for (let i = 0; i < batchSize; i++) {
      promiseArray.push(stakingContract.ownerOf(idCandidate));
      idCandidateArray.push(idCandidate);
      idCandidate++;
    }
    const ownerAddressArray = await Promise.all(promiseArray);
    for (let i = 0; i < batchSize; i++) {
      const ownerAddress = ownerAddressArray[i];
      if (ownerAddress.toLowerCase() === args.ethAddress.toLowerCase()) {
        const foundTokenID = idCandidateArray[i];
        console.log("found owned tokenID", foundTokenID);
        tokenIDs.push(foundTokenID);
      }
    }
  }
  return tokenIDs;
}

export async function fetchStakingNft(args: {
  tokenId: number;
}): Promise<StakingNft> {
  const rawStakingNft = await stakingContract.stakingNFTs(args.tokenId);
  const amount = Number(rawStakingNft["amount"]) / 1e18;
  const payoutFactor = Number(rawStakingNft["payoutFactor"]) / 1e18;
  const start = new Date(Number(rawStakingNft["start"]) * 1000);
  const end = new Date(Number(rawStakingNft["end"]) * 1000);
  const lastClaim = new Date(Number(rawStakingNft["lastClaim"]) * 1000);
  const years = end.getFullYear() - start.getFullYear();
  const apy = parseFloat(((100 * (payoutFactor - 1.0)) / years).toFixed(3));

  const claimedRewards =
    amount *
    payoutFactor *
    ((lastClaim!.getTime() - start.getTime()) /
      (end.getTime() - start.getTime()));

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

function getClaimFraction(stakingNft: StakingNft): number {
  return (
    (Date.now() - stakingNft.lastClaim.getTime()) /
    (stakingNft.end.getTime() - stakingNft.start.getTime())
  );
}

export function computeUnclaimedRewards(stakingNft: StakingNft): number {
  return (
    stakingNft.amount * stakingNft.payoutFactor * getClaimFraction(stakingNft)
  );
}

export function useAvinocBalance(args: { ethAddress: string | null }) {
  const [avinocBalance, setAvinocBalance] = React.useState<number | null>(null);
  const [fetchError, setFetchError] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (args.ethAddress) {
      fetchAvinocBalance(args.ethAddress);
    }
  }, [args.ethAddress]);

  async function fetchAvinocBalance(ethAddress: string) {
    try {
      const balance =
        bigNumberToNumber(await avinocContract.balanceOf(ethAddress)) / 1e18;
      setAvinocBalance(balance);
    } catch (e) {
      setFetchError(true);
      console.error(e);
    }
  }
  return { avinocBalance, fetchError };
}
