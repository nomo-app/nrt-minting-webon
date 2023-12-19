import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { NomoEvmNetwork } from "nomo-webon-kit";

export function navigateToMintingPage(
  network: NomoEvmNetwork,
  router: AppRouterInstance
) {
  router.push("/minting?network=" + network);
}

export function navigateToClaimingPage(router: AppRouterInstance) {
  const network = getNomoEvmNetwork();
  router.push("/claiming?network=" + network);
}

export const getNomoEvmNetwork = (): NomoEvmNetwork => {
  const searchParams = new URLSearchParams(window.location.search);
  const network = searchParams.get("network");
  if (!network) {
    throw new Error("Network not found in URL");
  }
  return network as NomoEvmNetwork;
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
