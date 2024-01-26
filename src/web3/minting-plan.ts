import { MintingNft } from "./web3-minting";

export function getMaxLinkableAmount(args: {
  mintingNFTs: Record<string, MintingNft> | null;
  nrtPrice: number;
}): bigint | null {
  if (!args.mintingNFTs) {
    return null;
  }
  let maxLinkableAmount = 0n;
  for (const nftId of Object.keys(args.mintingNFTs)) {
    const nft: MintingNft = args.mintingNFTs[nftId];
    const amountCapPowerNode = getAmountCapPowerNode(args.nrtPrice, nft);
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
  nrtPrice: number;
}): MintingPlan {
  const allNFTs: MintingNft[] = Object.values(args.mintingNFTs);
  const sortedNFTs = allNFTs.sort((a, b) => {
    return Number(b.mintingPower) - Number(a.mintingPower);
  });

  const filteredNFTs = sortedNFTs.filter((nft) => {
    const amountCapPowerNode = getAmountCapPowerNode(args.nrtPrice, nft);
    return nft.stakedTokens < amountCapPowerNode;
  });

  const mintingOps: MintingOperation[] = [];
  let remainingAmount = args.nrtAmount;
  for (const nft of filteredNFTs) {
    const amountCapPowerNode = getAmountCapPowerNode(args.nrtPrice, nft);
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

export function getNRTMintingPower(mintingPlan: MintingPlan): bigint {
  let totalMintingPower = 0n;
  for (const operation of mintingPlan.mintingOps) {
    const nft = operation.nft;
    const mintingPower = nft.mintingPower;
    totalMintingPower += mintingPower;
  }

  if (mintingPlan.mintingOps.length == 0) {
    return 240n;
  }

  totalMintingPower = totalMintingPower / BigInt(mintingPlan.mintingOps.length);

  return totalMintingPower;
}

function getAmountCapPowerNode(nrtPrice: number, nft: MintingNft): bigint {
  // divide by 10**10 because the end-result should have 8 digits
  const nrtPowerNodePriceInNrt = Number(nft.nrtPowerNodePrice / (10n ** 10n)) / nrtPrice;
  const amountCapPowerNode: bigint =
    BigInt(Math.floor(nrtPowerNodePriceInNrt));
  return amountCapPowerNode;
}
