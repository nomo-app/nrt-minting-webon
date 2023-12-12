import { AbstractProvider, ethers } from "ethers";
import { EthersjsNomoSigner } from "ethersjs-nomo-webons";
import { nomo } from "nomo-webon-kit";
import { useEffect, useState } from "react";

export const ethProvider = ethers.getDefaultProvider("mainnet");
export const ethSigner = new EthersjsNomoSigner(ethProvider);

export type Web3Error =
  | "ERROR_INSUFFICIENT_ETH"
  | "ERROR_TX_FAILED"
  | "ERROR_MISSING_WALLET_BACKUP";

export async function isWalletBackupAvailable(): Promise<boolean> {
  const res = await nomo.mnemonicBackupExisted();
  return res.mnemonicBackupExisted;
}

export function useEvmAddress(): { evmAddress: string | null } {
  const [evmAddress, setEvmAddress] = useState<string | null>(null);
  useEffect(() => {
    nomo.getEvmAddress().then((res: string) => {
      setEvmAddress(res);
    });
  }, []);
  return { evmAddress };
}

export async function waitForConfirmationOrThrow(txResponse: any) {
  console.log("txResponse", txResponse);
  await txResponse.wait(1);
  const txHash = txResponse.hash;
  const txReceipt = await ethProvider.getTransactionReceipt(txHash);
  console.log("txReceipt", txReceipt);
}

export function bigNumberToNumber(bigNumber: any) {
  return parseInt(bigNumber._hex);
}

export async function fetchEthGasPriceWithTip(
  provider: AbstractProvider
): Promise<bigint> {
  const feeData = await provider.getFeeData();
  const rawGasPrice = feeData.gasPrice;
  if (!rawGasPrice) {
    throw Error("failed to fetch gasPrice");
  }
  // we add a tip of 10% to prevent situations that the ETH-gasPrice raises too fast while a users is reading the "approve transaction dialog"
  const gasPrice = (rawGasPrice * 11n) / 10n;
  return gasPrice;
}

export async function fetchEthereumBalance(args: { ethAddress: string }) {
  const ethBalance =
    bigNumberToNumber(await ethProvider.getBalance(args.ethAddress)) / 1e18;
  return ethBalance;
}

export async function checkIfGasCanBePaid(args: {
  ethAddress: string;
  gasLimit: bigint;
}): Promise<"ERROR_INSUFFICIENT_ETH" | null> {
  const [ethBalance, gasPrice] = await Promise.all([
    fetchEthereumBalance({
      ethAddress: args.ethAddress,
    }),
    fetchEthGasPriceWithTip(ethProvider),
  ]);
  const costEstimation = args.gasLimit * gasPrice;
  console.log("costEstimation", costEstimation);
  if (ethBalance < costEstimation) {
    return "ERROR_INSUFFICIENT_ETH";
  } else {
    return null;
  }
}

export function isValidEthereumAddress(str: string): boolean {
  try {
    ethers.getAddress(str);
    return true;
  } catch (e) {
    return false;
  }
}
