import { MintingNft } from "./web3-minting";

const amountCapPowerNode: bigint = 1500n * 10n ** 8n; // this depends on the price of NRTPowerNodes!

export function getMaxLinkableAmount(args: {
  mintingNFTs: Record<string, MintingNft> | null;
}): bigint | null {
  if (!args.mintingNFTs) {
    return null;
  }
  let maxLinkableAmount = 0n;
  for (const nftId in Object.keys(args.mintingNFTs)) {
    const nft: MintingNft = args.mintingNFTs[nftId];
    const linkableAmount =
      amountCapPowerNode >= nft.stakedTokens
        ? amountCapPowerNode - nft.stakedTokens
        : 0n;
    maxLinkableAmount += linkableAmount;
  }
  return maxLinkableAmount;
}

export interface MintingOperation {
  nft: MintingNft;
  amountToLink: bigint;
}

export interface MintingPlan {
  mintingOps: MintingOperation[];
  totalAmountToLink: bigint;
}

/**
 * Try to maximize gains by preferring NFTs with a high minting power.
 */
export function getMintingPlan(args: {
  mintingNFTs: Record<string, MintingNft>;
  nrtAmount: bigint;
}): MintingPlan {
  const allNFTs: MintingNft[] = Object.values(args.mintingNFTs);
  const sortedNFTs = allNFTs.sort((a, b) => {
    return Number(b.mintingPower) - Number(a.mintingPower);
  });
  const filteredNFTs = sortedNFTs.filter((nft) => {
    return nft.stakedTokens < amountCapPowerNode;
  });

  const mintingOps: MintingOperation[] = [];
  let remainingAmount = args.nrtAmount;
  for (const nft of filteredNFTs) {
    const linkableAmount = amountCapPowerNode - nft.stakedTokens;
    const amountToLink =
      remainingAmount < linkableAmount ? remainingAmount : linkableAmount;

    mintingOps.push({
      nft,
      amountToLink,
    });
    remainingAmount -= amountToLink;
    if (remainingAmount <= 0n) {
      break;
    }
  }
  const totalAmountToLink = args.nrtAmount - remainingAmount;
  return { mintingOps, totalAmountToLink };
}
