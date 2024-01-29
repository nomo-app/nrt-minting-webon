import { useEffect } from "react";
import {
  MintingNft,
  fetchNftDetails,
  mintingContractAddress,
} from "./web3-minting";
import { getEthersProvider, useEvmAddress } from "./web3-common";
import React from "react";
import { Log } from "ethers";

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
  return await fetchZEN721TokenIDs({
    nftContractAddress: mintingContractAddress,
    address: args.ethAddress,
  });
}

async function fetchZEN721TokenIDs({
  nftContractAddress,
  address,
}: {
  nftContractAddress: string;
  address: string;
}): Promise<bigint[]> {
  const _block = "0x0";
  const eventSignature =
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
  const topicAddress = address.replace(/^0x/, "0x000000000000000000000000");

  const provider = getEthersProvider();

  // a more complex function exists for NFTs that are not soulbound
  const incomingTransfersFuture: Promise<Log[]> = provider.getLogs({
    fromBlock: _block,
    toBlock: "latest",
    address: nftContractAddress,
    topics: [eventSignature, null, topicAddress, null],
  });
  const results: Log[] = await incomingTransfersFuture;
  const tokenIDs: bigint[] = results.map(_getTokenID);
  return tokenIDs;
}

function _getTokenID(transferLog: Log): bigint {
  return BigInt(transferLog["topics"][3]);
}
