import { useEffect } from "react";
import {
  MintingNft,
  fetchNftDetails,
  getMintingContract,
} from "./web3-minting";
import { useEvmAddress } from "./web3-common";
import React from "react";

export function useMintingNFTs() {
  const [tokenIDs, setTokenIDs] = React.useState<Array<bigint>>([]);
  const { evmAddress } = useEvmAddress();
  const [mintingNFTs, setMintingNFTs] = React.useState<Record<
    string,
    MintingNft
  > | null>(null);

  useEffect(() => {
    if (evmAddress) {
      fetchMintingTokenIDs({ ethAddress: evmAddress })
        .then((tokenIDs: any) => {
          console.log("fetched tokenIDs: ", tokenIDs);
          setTokenIDs(tokenIDs);
          if (tokenIDs.length === 0) {
            setMintingNFTs({});
          }
        })
        .catch((e: any) => {
          console.error(e);
        });
    }
  }, [evmAddress]);

  useEffect(() => {
    tokenIDs.forEach((tokenId) => {
      fetchNftDetails({ tokenId })
        .then((stakingNft: any) => {
          setMintingNFTs((prevMintingNFTs) => {
            return {
              ...prevMintingNFTs,
              ["" + tokenId]: stakingNft,
            };
          });
        })
        .catch((e: any) => {
          console.error(e);
        });
    });
  }, [tokenIDs]);
  return { mintingNFTs };
}

async function fetchMintingTokenIDs(args: {
  ethAddress: string;
}): Promise<Array<bigint>> {
  return await enumerateOwnedTokenIDs(args);
}

function minimumBigInt(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

function getFirstPossibleTokenID(): bigint {
  return 0n;
}

async function enumerateOwnedTokenIDs(args: {
  ethAddress: string;
}): Promise<Array<bigint>> {
  const nftContract = getMintingContract();
  const lastPossibleNFTId: bigint = await nftContract.nextTokenId();
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
      const ownerOfPromise = nftContract.ownerOf(BigInt(idCandidate));
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
  }
  return tokenIDs;
}
