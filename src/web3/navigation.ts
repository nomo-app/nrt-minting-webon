import { NomoEvmNetwork } from "nomo-webon-kit";

export function navigateToMintingPage(network: NomoEvmNetwork) {
  window.location.assign("/minting?network=" + network);
}

export const getNomoEvmNetwork = (): NomoEvmNetwork => {
  const searchParams = new URLSearchParams(window.location.search);
  const network = searchParams.get("network");
  if (!network) {
    throw new Error("Network not found in URL");
  }
  return network as NomoEvmNetwork;
};

export const handleGoBack = () => {
  window.history.back(); // Navigate back using the browser's history API
};
