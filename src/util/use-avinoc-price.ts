import React from "react";
import { nomo } from "nomo-webon-kit";

export function useAvinocPrice() {
  const [avinocPrice, setAvinocPrice] = React.useState<number | null>(null);
  React.useEffect(() => {
    fetchAvinocPrice();
  }, []);

  async function fetchAvinocPrice() {
    try {
      const priceState = await nomo.getAssetPrice({
        name: "AVINOC",
        symbol: "AVINOC",
      });
      setAvinocPrice(priceState.price);
    } catch (e) {
      console.error(e);
    }
  }

  return { avinocPrice };
}

export function formatTokenDollarPrice(args: {
  tokenPrice: number | null;
  tokenAmount: number;
}): string {
  if (!args.tokenPrice) {
    return "-";
  }
  const fixedPrice =
    args.tokenAmount >= 10000
      ? (args.tokenPrice * args.tokenAmount).toFixed(0)
      : (args.tokenPrice * args.tokenAmount).toFixed(2);
  return "$" + fixedPrice;
}
