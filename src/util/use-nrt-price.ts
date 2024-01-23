import React from "react";
import { nomo } from "nomo-webon-kit";
import { getTokenStandard } from "@/web3/navigation";
import { nrtTokenContractAddress } from "@/web3/web3-minting";

export function useNrtPrice() {
  const [nrtPrice, setNrtPrice] = React.useState<number>(0.15);
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
    }
  }

  return { nrtPrice };
}

export function formatNRTAmount(args: { tokenAmount: bigint; ultraPrecision?: boolean }): string {
  const inpreciseTokenAmount = Number(args.tokenAmount) / 1e8;
  const tokenStandard = getTokenStandard();

  if (args.ultraPrecision && inpreciseTokenAmount > 0) {
    let precision: number;
    if (inpreciseTokenAmount < 0.1) {
      precision = 9;
    } else if (inpreciseTokenAmount < 1) {
      precision = 8;
    } else if (inpreciseTokenAmount < 10) {
      precision = 7;
    } else if (inpreciseTokenAmount < 100) {
      precision = 6;
    } else if (inpreciseTokenAmount < 1000) {
      precision = 5;
    } else if (inpreciseTokenAmount < 10000) {
      precision = 4;
    } else if (inpreciseTokenAmount < 100000) {
      precision = 3;
    } else {
      precision = 2;
    }
    return inpreciseTokenAmount.toFixed(precision) + " NRT " + tokenStandard;
  }

  const visibleAmount = inpreciseTokenAmount.toFixed(2);
  return visibleAmount + " NRT " + tokenStandard;
}

export function formatTokenDollarPrice(args: { tokenPrice: number | null; tokenAmount: bigint }): string {
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
