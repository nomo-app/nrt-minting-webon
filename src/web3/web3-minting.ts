import { ethers } from "ethers";
import StakingABI from "@/contracts/Staking.json";
import React from "react";
import genericErc20Abi from "@/contracts/erc20.json";
import {
  checkIfGasCanBePaid,
  getEthersProvider,
  getEthersSigner,
  isWalletBackupAvailable,
  waitForConfirmationOrThrow,
  Web3Error,
} from "@/web3/web3-common";
import { fetchWithRetryEtherScan } from "@/util/util";
import { getNomoEvmNetwork } from "./navigation";
import { Contract } from "ethers";
import { isFallbackModeActive } from "nomo-webon-kit";

export const avinocContractAddress =
  "0xf1ca9cb74685755965c7458528a36934df52a3ef"; // has the same address on both ERC20 and ZEN20

function getStakingContractAddress(): string {
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

function getStakingContract(): Contract {
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

async function fetchTokenIDCandidatesFromEtherscan(args: {
  ethAddress: string;
}): Promise<Array<bigint>> {
  const network = getNomoEvmNetwork();
  if (network !== "ethereum") {
    throw Error("etherscan does not work on ZENIQ Smartchain!");
  }
  const contractAddress = getStakingContractAddress();
  // https://docs.etherscan.io/getting-started/endpoint-urls
  const etherScanNFTEndpoint =
    "https://api.etherscan.io/api?module=account&action=tokennfttx&contractaddress=" +
    contractAddress +
    "&address=" +
    args.ethAddress +
    "&page=1&offset=100&startblock=0&endblock=27025780&sort=asc";

  const result = await fetchWithRetryEtherScan({ url: etherScanNFTEndpoint });
  if (!Array.isArray(result)) {
    throw Error("did not receive tokenIDs from etherscan");
  }
  return result
    .map((r) => BigInt(parseInt(r.tokenID)))
    .filter((tokenId) => !!tokenId);
}

export async function fetchOwnedTokenIDs(args: {
  ethAddress: string;
}): Promise<Array<bigint>> {
  const stakingContract = getStakingContract();
  const network = getNomoEvmNetwork();
  if (network === "zeniq-smart-chain") {
    return await fetchOwnedTokenIDsByEnumeratingAllTokens(args);
  }
  try {
    const idCandidates = await fetchTokenIDCandidatesFromEtherscan(args);
    const ownerOfPromises = idCandidates.map((idCandidate) =>
      stakingContract.ownerOf(idCandidate)
    );
    console.log("received idCandidates from etherscan", idCandidates);
    const ownerOfArray: string[] = await Promise.all(ownerOfPromises);
    console.log("received owners of idCandidates", ownerOfArray);
    return idCandidates.filter(
      (_, index) =>
        ownerOfArray[index].toLowerCase() === args.ethAddress.toLowerCase()
    );
  } catch (e) {
    console.error(e);
  }
  return await fetchOwnedTokenIDsByEnumeratingAllTokens(args);
}

function getFirstPossibleTokenID(): bigint {
  const network = getNomoEvmNetwork();
  if (network === "zeniq-smart-chain") {
    return 1000000000n;
  } else if (network === "ethereum") {
    return 1n;
  } else {
    throw Error("unsupported network " + network);
  }
}

async function fetchOwnedTokenIDsByEnumeratingAllTokens(args: {
  ethAddress: string;
}): Promise<Array<bigint>> {
  const stakingContract = getStakingContract();
  const lastPossibleNFTId: bigint = await stakingContract.totalNFTs();
  const maxBatchSize: bigint = 10n;

  const tokenIDs: Array<bigint> = [];
  let idCandidate: bigint = getFirstPossibleTokenID();
  console.log(
    args.ethAddress +
      ": Starting search for owned tokenIDs between the IDs " +
      idCandidate +
      " and " +
      lastPossibleNFTId +
      "..."
  );
  while (idCandidate < lastPossibleNFTId) {
    const batchSize: bigint = minimumBigInt(
      lastPossibleNFTId - idCandidate,
      maxBatchSize
    );
    const promiseArray = [];
    const idCandidateArray: Array<bigint> = [];
    for (let i = 0; i < batchSize; i++) {
      const ownerOfPromise = stakingContract.ownerOf(BigInt(idCandidate));
      promiseArray.push(ownerOfPromise);
      idCandidateArray.push(BigInt(idCandidate));
      idCandidate++;
    }
    const ownerAddressArray: PromiseSettledResult<any>[] =
      await Promise.allSettled(promiseArray); // can pipe multiple promises over the same HTTP-request

    for (let i = 0; i < batchSize; i++) {
      const settleResult: PromiseSettledResult<any> = ownerAddressArray[i];
      if (settleResult.status === "fulfilled") {
        const ownerAddress: string = settleResult.value;
        if (
          ownerAddress.toLowerCase().includes(args.ethAddress.toLowerCase())
        ) {
          const foundTokenID = idCandidateArray[i];
          console.log("found owned tokenID", foundTokenID);
          tokenIDs.push(foundTokenID);
        }
      }
    }
    if (tokenIDs.length > 0 && isFallbackModeActive()) {
      break;
    }
  }
  return tokenIDs;
}

function minimumBigInt(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
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
    10n ** 18n
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
