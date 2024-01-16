import { NomoEvmNetwork } from "nomo-webon-kit";
import { NavigateFunction } from "react-router-dom";

export function navigateToMintingPage(
  network: NomoEvmNetwork,
  navigate: NavigateFunction
) {
  navigate("/minting?network=" + network);
}

export function navigateToClaimingPage(navigate: NavigateFunction) {
  const searchParams = getSearchParams();
  // preserve URL params when navigating to claiming page
  navigate("/claiming?" + searchParams.toString());
}

function getSearchParams() {
    const url = window.location.href;
    const searchParams = new URLSearchParams(url.split("?")[1]);
    return searchParams;
}

export const getNomoEvmNetwork = (): NomoEvmNetwork => {
  return "zeniq-smart-chain";
};

export const getNFTID = (): bigint | null => {
  const searchParams = getSearchParams();
  const rawNftId = searchParams.get("nftid");
  if (!rawNftId || rawNftId === "null") {
    return null;
  }
  return BigInt(rawNftId);
};

export function getTokenStandard() {
  return "ZEN20";
}

export const handleGoBack = () => {
  window.history.back(); // Navigate back using the browser's history API
};
