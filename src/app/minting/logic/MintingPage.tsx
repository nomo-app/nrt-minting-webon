import "@/util/i18n"; // needed to initialize i18next
import React, { useEffect } from "react";
import "@/common/colors.css";
import { SelectChangeEvent } from "@mui/material/Select";
import { CongratDialogSlide } from "@/app/minting/ui/CongratDialog";
import { ConfirmDialogSlide } from "@/app/minting/ui/ConfirmDialog";
import {
  StakeError,
  submitStakeTransaction,
  useAvinocBalance,
  useSafirAvinocSig,
} from "@/web3/web3-minting";
import { RewardPredictionBox } from "@/app/minting/ui/RewardPredictionBox";
import { StatusBox } from "@/app/minting/ui/MintingComponents";
import { StakeButton } from "@/app/minting/ui/MintingComponents";
import { SwitchToRewardPageButton } from "@/app/minting/ui/MintingComponents";
import { MintingTitleBar } from "@/app/minting/ui/MintingComponents";
import { TokenAmountInput } from "@/app/minting/ui/MintingComponents";
import { SelectYears } from "@/app/minting/ui/MintingComponents";
import { formatNRTAmount, useAvinocPrice } from "@/util/use-avinoc-price";
import { useEvmAddress } from "@/web3/web3-common";
import ErrorDetails from "@/common/ErrorDetails";
import { useNomoTheme } from "@/util/util";
import "./MintingPage.scss";

export type PageState =
  | "IDLE"
  | "PENDING_SUBMIT_TX"
  | "ERROR_FETCH_FAILED"
  | StakeError;

function isPendingState(pageState: PageState) {
  return pageState.startsWith("PENDING");
}

const MintingPage: React.FC = () => {
  useNomoTheme();

  const { avinocPrice } = useAvinocPrice();
  const { evmAddress: ethAddress } = useEvmAddress();
  const { avinocBalance: tokenBalance, fetchError: balanceFetchError } =
    useAvinocBalance({
      ethAddress,
    });
  const { safirSig } = useSafirAvinocSig();
  const [tokenAmount, setAvinocAmount] = React.useState<bigint>(-1n);
  const [years, setYears] = React.useState<bigint>(10n);
  const [pageState, setPageState] = React.useState<PageState>("IDLE");
  const [txError, setTxError] = React.useState<Error | null>(null);
  const networkBonus = !!safirSig;

  useEffect(() => {
    if (balanceFetchError) {
      setPageState("ERROR_FETCH_FAILED");
      setTxError(balanceFetchError);
    }
  }, [balanceFetchError]);

  useEffect(() => {
    if (tokenBalance) {
      const roundedAvinocBalance = tokenBalance - (tokenBalance % 10n ** 18n);
      setAvinocAmount(roundedAvinocBalance);
    }
  }, [tokenBalance]);

  const handleYearChange = (event: SelectChangeEvent) => {
    const yearString: string = event.target.value as string;
    const yearNumber: bigint = BigInt(parseInt(yearString));
    setYears(yearNumber);
  };

  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = React.useState(false);

  function onClickStakeButton() {
    if (tokenAmount <= 0n) {
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
    submitStakeTransaction({
      avinocAmount: tokenAmount,
      years,
      safirSig,
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
          value={tokenAmount}
          maxValue={tokenBalance}
          onChange={(value) => setAvinocAmount(value)}
        />
        <div style={{ color: "white", fontFamily: "Helvetica" }}>
          {"Maximum linkable amount: " +
            formatNRTAmount({
              tokenAmount: 1000n * 10n ** 18n,
            })}
        </div>
        <div style={{ color: "white", fontFamily: "Helvetica", paddingBottom: "15px" }}>
          {"Linking period: 720 Days"}
        </div>
        {/* <SelectYears years={years} onChange={handleYearChange} /> */}
      </div>
      <div className="minting-reward-prediction-box">
        <RewardPredictionBox
          years={years}
          avinocAmount={tokenAmount}
          avinocPrice={avinocPrice}
          networkBonus={networkBonus}
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
        isOpen={confirmDialogOpen}
        years={years}
        selectedAmount={tokenAmount}
        networkBonus={networkBonus}
        handleClose={() => setConfirmDialogOpen(false)}
        handleConfirm={() => submitMinting()}
      />
      <CongratDialogSlide
        isOpen={successDialogOpen}
        handleClose={() => setSuccessDialogOpen(false)}
        translationKey={"staking.DialogSuccess"}
      />
    </div>
    // <div style={mintingMainFlexBox}>
    //   <div style={{ flexGrow: 10 }} />
    //   <MintingTitleBar />
    //   <StatusBox pageState={pageState} />
    //   {!!txError && <ErrorDetails error={txError} />}
    //   <Card variant={"elevation"} elevation={3} className={"input-card"}>
    //     <AvinocAmountInput
    //       value={avinocAmount}
    //       maxValue={avinocBalance}
    //       onChange={(value) => setAvinocAmount(value)}
    //     />
    //     <SelectYears years={years} onChange={handleYearChange} />
    //   </Card>
    //   <RewardPredictionBox
    //     years={years}
    //     avinocAmount={avinocAmount}
    //     avinocPrice={avinocPrice}
    //     networkBonus={networkBonus}
    //   />
    //   <StakeButton
    //     disabled={isPendingState(pageState)}
    //     onClick={onClickStakeButton}
    //   />
    //   <ConfirmDialogSlide
    //     isOpen={confirmDialogOpen}
    //     years={years}
    //     selectedAmount={avinocAmount}
    //     networkBonus={networkBonus}
    //     handleClose={() => setConfirmDialogOpen(false)}
    //     handleConfirm={() => submitMinting()}
    //   />
    //   <CongratDialogSlide
    //     isOpen={successDialogOpen}
    //     handleClose={() => setSuccessDialogOpen(false)}
    //     translationKey={"staking.DialogSuccess"}
    //   />
    //   <SwitchToRewardPageButton disabled={isPendingState(pageState)} />
    //   <div style={{ flexGrow: 50 }} />
    // </div>
  );
};

export default MintingPage;
