import "@/util/i18n"; // needed to initialize i18next
import React, { useEffect } from "react";
import "@/common/colors.css";
import { CongratDialogSlide } from "@/app/minting/ui/CongratDialog";
import { ConfirmDialogSlide } from "@/app/minting/ui/ConfirmDialog";
import {
  StakeError,
  submitMintingTx,
  useNrtBalance,
} from "@/web3/web3-minting";
import { RewardPredictionBox } from "@/app/minting/ui/RewardPredictionBox";
import { StatusBox } from "@/app/minting/ui/MintingComponents";
import { StakeButton } from "@/app/minting/ui/MintingComponents";
import { SwitchToRewardPageButton } from "@/app/minting/ui/MintingComponents";
import { MintingTitleBar } from "@/app/minting/ui/MintingComponents";
import { TokenAmountInput } from "@/app/minting/ui/MintingComponents";
import { formatNRTAmount, useNrtPrice } from "@/util/use-nrt-price";
import { useEvmAddress } from "@/web3/web3-common";
import ErrorDetails from "@/common/ErrorDetails";
import { useNomoTheme } from "@/util/util";
import "./MintingPage.scss";
import { useMintingNFTs } from "@/web3/nft-fetching";
import {
  MintingPlan,
  getMaxLinkableAmount,
  getMintingPlan,
} from "@/web3/minting-plan";

export type PageState =
  | "IDLE"
  | "PENDING_SUBMIT_TX"
  | "ERROR_FETCH_FAILED"
  | StakeError;

const MintingPage: React.FC = () => {
  useNomoTheme();

  const { nrtPrice } = useNrtPrice();
  const { evmAddress: ethAddress } = useEvmAddress();
  const { nrtBalance, fetchError: balanceFetchError } = useNrtBalance({
    ethAddress,
  });
  const [nrtAmount, setNrtAmount] = React.useState<bigint>(-1n);
  const [pageState, setPageState] = React.useState<PageState>("IDLE");
  const [txError, setTxError] = React.useState<Error | null>(null);

  const { mintingNFTs } = useMintingNFTs();
  const maxLinkableAmount = getMaxLinkableAmount({ mintingNFTs });
  const mintingPlan: MintingPlan = getMintingPlan({
    mintingNFTs: mintingNFTs ?? {},
    nrtAmount,
  });

  function isPendingState(pageState: PageState) {
    return pageState.startsWith("PENDING") || maxLinkableAmount === null;
  }

  useEffect(() => {
    if (balanceFetchError) {
      setPageState("ERROR_FETCH_FAILED");
      setTxError(balanceFetchError);
    }
  }, [balanceFetchError]);

  useEffect(() => {
    if (nrtBalance) {
      const roundedBalance = nrtBalance - (nrtBalance % 10n ** 8n);
      setNrtAmount(roundedBalance);
    }
  }, [nrtBalance]);

  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = React.useState(false);

  function onClickStakeButton() {
    if (nrtAmount <= 0n) {
      setPageState("ERROR_INSUFFICIENT_NRT");
      return;
    }
    setConfirmDialogOpen(true);
  }

  function submitMinting() {
    setConfirmDialogOpen(false);
    if (!ethAddress) {
      setPageState("ERROR_INSUFFICIENT_ETH");
      return;
    }

    setPageState("PENDING_SUBMIT_TX");
    submitMintingTx({
      mintingPlan,
      ethAddress,
    })
      .then((stakeError) => {
        if (stakeError) {
          setPageState(stakeError);
        } else {
          setPageState("IDLE");
          setSuccessDialogOpen(true);
        }
      })
      .catch((e) => {
        setPageState("ERROR_TX_FAILED");
        setTxError(e);
        console.error(e);
      });
  }

  return (
    <div className="minting-page-content">
      <div className="staking-title-bar">
        <MintingTitleBar />
      </div>
      <div className="minting-card">
        <TokenAmountInput
          value={nrtAmount}
          maxValue={nrtBalance}
          onChange={(value) => setNrtAmount(value)}
        />
        <div className="minting-card-information">
          <div className="information-entry">
            <p>Number of NRT Power Nodes:</p>
            <p style={{ fontWeight: "bold" }}>
              {mintingNFTs != null
                ? Object.keys(mintingNFTs).length.toString()
                : "Loading..."}
            </p>
          </div>
          <div className="information-entry">
            <p>Max. linkable amount:</p>
            <p style={{ fontWeight: "bold" }}>
              {maxLinkableAmount != null
                ? formatNRTAmount({ tokenAmount: maxLinkableAmount })
                : "Loading..."}
            </p>
          </div>
          <div className="information-entry">
            <p>Linking period:</p>
            <p style={{ fontWeight: "bold" }}>720 Days</p>
          </div>
        </div>
      </div>
      <div className="minting-reward-prediction-box">
        <RewardPredictionBox
          avinocAmount={nrtAmount}
          avinocPrice={nrtPrice}
          networkBonus={true}
        />
      </div>

      <div className="minting-footer">
        <StakeButton
          disabled={isPendingState(pageState)}
          onClick={onClickStakeButton}
        />
        <SwitchToRewardPageButton disabled={isPendingState(pageState)} />
      </div>

      <div className="minting-status-box">
        <StatusBox pageState={pageState} />
      </div>
      {!!txError && (
        <div className="minting-error-details">
          <ErrorDetails error={txError} />
        </div>
      )}

      <ConfirmDialogSlide
        mintingPlan={mintingPlan}
        isOpen={confirmDialogOpen}
        handleClose={() => setConfirmDialogOpen(false)}
        handleConfirm={() => submitMinting()}
      />
      <CongratDialogSlide
        isOpen={successDialogOpen}
        handleClose={() => setSuccessDialogOpen(false)}
        translationKey={"staking.DialogSuccess"}
      />
    </div>
  );
};

export default MintingPage;
