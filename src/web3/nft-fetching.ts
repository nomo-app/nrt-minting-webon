import { fetchWithRetryEtherScan } from "@/util/util";
import { getNomoEvmNetwork } from "./navigation";
import { getMintingContract, mintingContractAddress } from "./web3-minting";
import { NomoEvmNetwork, nomo, isFallbackModeActive } from "nomo-webon-kit";

export async function fetchMintingTokenIDs(args: {
  ethAddress: string;
}): Promise<Array<bigint>> {
  if (isFallbackModeActive()) {
    return await fetchMintingTokenIDsFallback(args);
  }

  const network: NomoEvmNetwork = getNomoEvmNetwork();
  const { nfts: allNFTs } = await nomo.getNFTs({ network });
  console.log("allNFTs", allNFTs);
  const contractAddress = mintingContractAddress;
  const stakingNFTs = allNFTs.filter(
    (nft: any) =>
      nft.contractAddress.toLowerCase() === contractAddress.toLowerCase()
  );
  console.log("stakingNFTs", stakingNFTs);

  const tokenIDs = stakingNFTs.map((nft: any) => BigInt(nft.tokenID));
  console.log("tokenIDs", tokenIDs);
  return tokenIDs;
}

async function fetchMintingTokenIDsFallback(args: {
  ethAddress: string;
}): Promise<Array<bigint>> {
  const stakingContract = getMintingContract();
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

async function fetchTokenIDCandidatesFromEtherscan(args: {
  ethAddress: string;
}): Promise<Array<bigint>> {
  const network = getNomoEvmNetwork();
  if (network !== "ethereum") {
    throw Error("etherscan does not work on ZENIQ Smartchain!");
  }
  const contractAddress = mintingContractAddress;
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

function minimumBigInt(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
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
  const stakingContract = getMintingContract();
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
    if (tokenIDs.length > 0) {
      break; // only for the fallback-mode, will skip some NFTs for performance reasons
    }
  }
  return tokenIDs;
}
