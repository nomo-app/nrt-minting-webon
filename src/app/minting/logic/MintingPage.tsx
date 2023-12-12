"use client";

import "@/util/i18n"; // needed to initialize i18next
import React, { useEffect } from "react";
import "@/common/colors.css";
import { SelectChangeEvent } from "@mui/material/Select";
import { Card } from "@mui/material";
import { CongratDialogSlide } from "@/app/minting/ui/CongratDialog";
import { ConfirmDialogSlide } from "@/app/minting/ui/ConfirmDialog";
import {
  StakeError,
  submitStakeTransaction,
  useAvinocBalance,
} from "@/web3/web3-minting";
import { usePreventServerSideRendering } from "@/util/util";
import { RewardPredictionBox } from "@/app/minting/ui/RewardPredictionBox";
import { StatusBox } from "@/app/minting/ui/MintingComponents";
import { StakeButton } from "@/app/minting/ui/MintingComponents";
import { SwitchToRewardPageButton } from "@/app/minting/ui/MintingComponents";
import { StakingTitleBar } from "@/app/minting/ui/MintingComponents";
import { AvinocAmountInput } from "@/app/minting/ui/MintingComponents";
import { SelectYears } from "@/app/minting/ui/MintingComponents";
import { mintingMainFlexBox } from "@/app/minting/ui/minting-style";
import { useAvinocPrice } from "@/util/use-avinoc-price";

export type PageState =
  | "IDLE"
  | "PENDING_SUBMIT_TX"
  | "ERROR_FETCH_FAILED"
  | StakeError;

function isPendingState(pageState: PageState) {
  return pageState.startsWith("PENDING");
}

const MintingPage: React.FC = () => {
  const { isClient } = usePreventServerSideRendering();

  const { avinocPrice } = useAvinocPrice();
  const { address: ethAddress } = {
    address: "0x05870f1507d820212E921e1f39f14660336231D1",
  }; // TODO
  const { avinocBalance, fetchError: balanceFetchError } = useAvinocBalance({
    ethAddress,
  });
  const { safirSig } = { safirSig: null }; // TODO useSafirAvinocSig();
  const [avinocAmount, setAvinocAmount] = React.useState<number>(0);
  const [years, setYears] = React.useState<number>(10);
  const [pageState, setPageState] = React.useState<PageState>("IDLE");
  const networkBonus = !!safirSig;

  useEffect(() => {
    if (typeof avinocBalance === "number") {
      setAvinocAmount(Math.floor(avinocBalance));
    }
  }, [avinocBalance]);

  useEffect(() => {
    if (balanceFetchError) {
      setPageState("ERROR_FETCH_FAILED");
    }
  }, [balanceFetchError]);

  const handleYearChange = (event: SelectChangeEvent) => {
    const yearString: string = event.target.value as string;
    const yearNumber: number = parseInt(yearString);
    setYears(yearNumber);
  };

  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = React.useState(false);

  function onClickStakeButton() {
    if (avinocAmount < 1 || isNaN(avinocAmount)) {
      setPageState("ERROR_INSUFFICIENT_AVINOC");
      return;
    }
    setConfirmDialogOpen(true);
  }

  function submitStaking() {
    setConfirmDialogOpen(false);
    if (!ethAddress) {
      setPageState("ERROR_INSUFFICIENT_ETH");
      return;
    }

    setPageState("PENDING_SUBMIT_TX");
    submitStakeTransaction({ avinocAmount, years, safirSig, ethAddress })
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
        console.error(e);
      });
  }

  if (!isClient) {
    return <div />;
  }
  return (
    <div style={mintingMainFlexBox}>
      <div style={{ flexGrow: 10 }} />
      <StakingTitleBar />
      <StatusBox pageState={pageState} />
      <Card variant={"elevation"} elevation={3} className={"input-card"}>
        <AvinocAmountInput
          value={avinocAmount}
          maxValue={
            typeof avinocBalance === "number" ? Math.floor(avinocBalance) : null
          }
          onChange={(value) => setAvinocAmount(value)}
        />
        <SelectYears years={years} onChange={handleYearChange} />
      </Card>
      <RewardPredictionBox
        years={years}
        avinocAmount={avinocAmount}
        avinocPrice={avinocPrice}
        networkBonus={networkBonus}
      />
      <StakeButton
        disabled={isPendingState(pageState)}
        onClick={onClickStakeButton}
      />
      <ConfirmDialogSlide
        isOpen={confirmDialogOpen}
        years={years}
        selectedAmount={avinocAmount}
        networkBonus={networkBonus}
        handleClose={() => setConfirmDialogOpen(false)}
        handleConfirm={() => submitStaking()}
      />
      <CongratDialogSlide
        isOpen={successDialogOpen}
        handleClose={() => setSuccessDialogOpen(false)}
        translationKey={"staking.DialogSuccess"}
      />
      <SwitchToRewardPageButton disabled={isPendingState(pageState)} />
      <div style={{ flexGrow: 50 }} />
    </div>
  );
};

export default MintingPage;
