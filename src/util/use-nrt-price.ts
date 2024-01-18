import React from "react";
import { nomo } from "nomo-webon-kit";
import { getTokenStandard } from "@/web3/navigation";
import { nrtTokenContractAddress } from "@/web3/web3-minting";

export function useNrtPrice() {
  const [nrtPrice, setNrtPrice] = React.useState<number | null>(null);
  React.useEffect(() => {
    fetchNrtPrice();
  }, []);

  async function fetchNrtPrice() {
    try {
      const priceState = await nomo.getAssetPrice({
        symbol: "NRT",
        contractAddress: nrtTokenContractAddress,
        network: "zeniq-smart-chain",
      });
      setNrtPrice(priceState.price);
    } catch (e) {
      console.log("failed to fetch NRT price. set to default price.");
      setNrtPrice(0.15);
    }
  }

  return { nrtPrice };
}

export function formatNRTAmount(args: {
  tokenAmount: bigint;
  ultraPrecision?: boolean;
}): string {
  const inpreciseTokenAmount = Number(args.tokenAmount) / 1e8;
  const tokenStandard = getTokenStandard();

  if (args.ultraPrecision && inpreciseTokenAmount > 0) {
    const log2 = Math.floor(Math.log2(inpreciseTokenAmount));
    const precision = Math.max(0, 10 - log2);
    return inpreciseTokenAmount.toFixed(precision) + " NRT " + tokenStandard;
  }

  const visibleAmount = inpreciseTokenAmount.toFixed(2);
  return visibleAmount + " NRT " + tokenStandard;
}

export function formatTokenDollarPrice(args: {
  tokenPrice: number | null;
  tokenAmount: bigint;
}): string {
  if (!args.tokenPrice) {
    return "-";
  }
  const inpreciseTokenAmount = Number(args.tokenAmount) / 1e8;
  const fixedPrice =
    inpreciseTokenAmount >= 500
      ? (args.tokenPrice * inpreciseTokenAmount).toFixed(0)
      : (args.tokenPrice * inpreciseTokenAmount).toFixed(2);
  return "$" + fixedPrice;
}
