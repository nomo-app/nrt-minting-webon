import { NomoEvmNetwork } from "nomo-webon-kit";
import { NavigateFunction } from "react-router-dom";

export function navigateToMintingPage(
  network: NomoEvmNetwork,
  navigate: NavigateFunction
) {
  navigate("/minting?network=" + network);
}

export function navigateToClaimingPage(navigate: NavigateFunction) {
  const network = getNomoEvmNetwork();
  const nftid = getNFTID();
  navigate("/claiming?network=" + network + (!!nftid ? "&nftid=" + nftid : ""));
}

export const getNomoEvmNetwork = (): NomoEvmNetwork => {
  const searchParams = new URLSearchParams(window.location.search);
  const network = searchParams.get("network");
  if (!network) {
    throw new Error("Network not found in URL");
  }
  return network as NomoEvmNetwork;
};

export const getNFTID = (): bigint | null => {
  const searchParams = new URLSearchParams(window.location.search);
  const rawNftId = searchParams.get("nftid");
  if (!rawNftId || rawNftId === "null") {
    return null;
  }
  return BigInt(rawNftId);
};

export function getTokenStandard() {
  const network = getNomoEvmNetwork();
  if (network === "ethereum") {
    return "ERC20";
  } else if (network === "zeniq-smart-chain") {
    return "ZEN20";
  } else {
    throw new Error("Unsupported network " + network);
  }
}

export const handleGoBack = () => {
  window.history.back(); // Navigate back using the browser's history API
};
