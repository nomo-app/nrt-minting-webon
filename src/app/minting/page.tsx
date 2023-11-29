"use client";

import "../../i18n";
import React, { useEffect } from "react";
import "./MintingPage.css";
import "../../shared-css/colors.css";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { Alert, Card, CircularProgress, InputLabel } from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import avinoc_logo from "../../assets/avinoc_ic.svg";
import staking_icon from "../../assets/staking_ic.svg";
import { useTranslation } from "react-i18next";
import { CongratDialogSlide } from "./CongratDialog";
import { ConfirmDialogSlide } from "./ConfirmDialog";
import {
  StakeError,
  submitStakeTransaction,
  useAvinocBalance,
} from "@/web3/web3-minting";
import { UnreachableCaseError } from "../../util/typesafe";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { getApyValues } from "../../util/staking-rewards";

type PageState =
  | "IDLE"
  | "PENDING_SUBMIT_TX"
  | "ERROR_FETCH_FAILED"
  | StakeError;

function isPendingState(pageState: PageState) {
  return pageState.startsWith("PENDING");
}

function isErrorState(pageState: PageState) {
  return pageState.startsWith("ERROR");
}

const MintingPage: React.FC = () => {
  const { avinocPrice } = { avinocPrice: 0.3 }; // TODO useAvinocPrice();
  const { address: ethAddress } =  { address: "0x05870f1507d820212E921e1f39f14660336231D1" }; // TODO
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

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        textAlign: "center",
        fontSize: "calc(10px + 1vmin)",
        height: "100vh",
        paddingLeft: "10%",
        paddingRight: "10%",
        background: "url(assets/registrationbackground.svg)",
        backgroundRepeat: "no-repeat",
        backgroundSize: "100%",
        backgroundPosition: "bottom",
        overflowY: "scroll",
      }}
    >
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

const StatusBox: React.FC<{ pageState: PageState }> = (props) => {
  const { t } = useTranslation();

  if (props.pageState === "IDLE") {
    return <div />;
  }

  function getStatusMessage() {
    switch (props.pageState) {
      case "ERROR_INSUFFICIENT_ETH":
      case "ERROR_INSUFFICIENT_AVINOC":
      case "ERROR_FETCH_FAILED":
      case "ERROR_MISSING_WALLET_BACKUP":
      case "ERROR_TX_FAILED":
      case "ERROR_INSUFFICIENT_RESERVES":
      case "ERROR_LIMIT_EXCEEDED":
      case "PENDING_SUBMIT_TX":
        return t("status." + props.pageState);
      case "IDLE":
        return ""; // should never happen
      default:
        throw new UnreachableCaseError(props.pageState);
    }
  }

  if (isErrorState(props.pageState)) {
    return (
      <div style={{ margin: "10px" }}>
        <Alert severity={"error"}>{getStatusMessage()}</Alert>
      </div>
    );
  } else {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          marginBottom: "5px",
          marginTop: "10px",
        }}
      >
        <CircularProgress />
        <div
          style={{
            fontWeight: "bold",
            marginLeft: "5px",
            display: "flex",
            alignItems: "center",
          }}
        >
          {getStatusMessage()}
        </div>
      </div>
    );
  }
};

const StakeButton: React.FC<{ disabled: boolean; onClick: () => void }> = (
  props
) => {
  return (
    <button
      disabled={props.disabled}
      className="primary-button"
      type="button"
      onClick={() => props.disabled || props.onClick()}
      style={{
        color: props.disabled ? "white" : undefined,
        backgroundColor: props.disabled
          ? "gray"
          : "var(--color-primary-button-background)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          columnGap: "8px",
          alignItems: "center",
          fontSize: "small",
        }}
      >
        <img src={staking_icon} alt={""} height={"14px"} />
        {"Stake"}
      </div>
    </button>
  );
};

const SwitchToRewardPageButton: React.FC<{
  disabled: boolean;
}> = (props) => {
  const { t } = useTranslation();

  return (
    <a
      href={props.disabled ? undefined : "TODO"}
      style={{ width: "100%" }}
    >
      <button
        style={{
          color: props.disabled ? "white" : undefined,
          backgroundColor: props.disabled
            ? "gray"
            : "var(--color-secondary-button-background)",
        }}
        className="secondary-button"
      >
        {t("staking.claimRewards")}
      </button>
    </a>
  );
};

const StakingTitleBar: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        alignContent: "space-around",
        width: "100%",
        justifyContent: "center",
        marginTop: "20px",
      }}
    >
      <div style={{ flexGrow: 11 }} />
      <img
        src={avinoc_logo}
        className="Avinoc-Hex"
        alt="hex"
        style={{
          width: "10%",
        }}
      />
      <div style={{ flexGrow: 5 }} />
      <div style={{ fontWeight: "bold", fontSize: "large" }}>
        {t("staking.AvinocStaking")}
      </div>
      <div style={{ flexGrow: 15 }} />
    </div>
  );
};

const AvinocAmountInput: React.FC<{
  onChange: (value: number) => void;
  value: number;
  maxValue: number | null;
}> = (props) => {
  const { t } = useTranslation();

  const onChangeWrapper = (event: any) => {
    const value: number = parseInt(event.target.value ?? 0);
    if (typeof props.maxValue === "number" && value >= props.maxValue) {
      props.onChange(Math.floor(props.maxValue));
    } else {
      props.onChange(value);
    }
  };

  const availableText =
    props.maxValue !== null && props.maxValue !== undefined
      ? `${t("staking.available")}: ${props.maxValue} AVINOC`
      : t("staking.loadBalance");

  const isError = isNaN(props.value) || props.value < 0;

  return (
    <TextField
      id="textfield_outline"
      helperText={availableText}
      label={t("staking.amountStaking")}
      variant="standard"
      type={"number"}
      style={{
        width: "90%",
        margin: "8px",
      }}
      error={isError}
      value={isNaN(props.value) ? "" : props.value}
      onChange={onChangeWrapper}
      inputProps={{
        inputMode: "decimal",
      }}
      InputProps={{
        endAdornment: (
          <InputAdornment
            onClick={() => !props.maxValue || props.onChange(props.maxValue)}
            position="end"
          >
            <div id={"max_button"} className={"MaxButton"}>
              MAX
            </div>
          </InputAdornment>
        ),
        startAdornment: (
          <InputAdornment position="start">
            <img
              src={avinoc_logo}
              className="Zeniq-Logo"
              alt="logo"
              style={{ width: 20, height: 20 }}
            />
          </InputAdornment>
        ),
      }}
    />
  );
};

const SelectYears: React.FC<{
  years: number;
  onChange: (e: SelectChangeEvent) => void;
}> = (props) => {
  const { t } = useTranslation();

  return (
    <FormControl
      variant={"standard"}
      sx={{ m: 1 }}
      style={{ width: "90%", margin: "8px" }}
    >
      <InputLabel id="stakingTimeTitle">{t("reward.stakingPeriod")}</InputLabel>
      <Select
        label="Staking Time"
        value={"" + props.years}
        onChange={props.onChange}
        style={{ fontWeight: "bold" }}
      >
        <MenuItem value={1}>{"1 " + t("staking.year")}</MenuItem>
        <MenuItem value={3}>{"3 " + t("staking.years")}</MenuItem>
        <MenuItem value={5}>{"5 " + t("staking.years")}</MenuItem>
        <MenuItem value={10}>{"10 " + t("staking.years")}</MenuItem>
        {/*<MenuItem value={15}>{"15 " + t("staking.years")}</MenuItem>*/}
      </Select>
    </FormControl>
  );
};

const RewardPredictionBox: React.FC<{
  years: number;
  avinocAmount: number;
  avinocPrice: number | null;
  networkBonus: boolean;
}> = (props) => {
  const { t } = useTranslation();

  function getApy(years: number): number {
    if (props.networkBonus) {
      return getApyValues(years).apyWithBonus;
    } else {
      return getApyValues(years).apyWithoutBonus;
    }
  }

  function getRewardAmount(years: number): number {
    const apy = getApy(years);

    return (
      years * (props.avinocAmount * (1 + Number(apy)) - props.avinocAmount)
    );
  }

  const apyLabel = props.networkBonus
    ? "+" + 100.0 * getApy(props.years) + "%"
    : t("reward.disabled");

  function getRewardLabel(years: number): string {
    if (props.avinocAmount === 0 || isNaN(props.avinocAmount)) {
      return t("staking.enterAmount");
    } else {
      const rewards = getRewardAmount(years);
      return props.avinocAmount >= 10000
        ? `+${rewards.toFixed(0)} `
        : `+${rewards.toFixed(2)} `;
    }
  }

  function getRewardDollarPrice(years: number): string {
    if (props.avinocAmount === 0 || isNaN(props.avinocAmount)) {
      return t("staking.enterAmount");
    } else {
      const amount = getRewardAmount(years);
      return "rewardDollarPrice"; // TODO
      // return `${formatTokenDollarPrice({
      //   tokenPrice: props.avinocPrice,
      //   tokenAmount: amount,
      // })} `;
    }
  }

  function getYearsName(years: number): string {
    if (years === 1) {
      return years + " " + t("staking.year");
    } else {
      return years + " " + t("staking.years");
    }
  }

  const maxYears = 10;
  const isMaxYears: boolean = props.years === maxYears;

  return (
    <Card
      variant={"elevation"}
      elevation={0}
      style={{
        width: "100%",
        margin: "10px",
      }}
    >
      {/*row 1 network bonus*/}
      <BonusBox apyLabel={apyLabel} networkBonus={props.networkBonus} />

      {/*ro2 your rewards */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-evenly",
          alignItems: "center",
          width: "100%",
          padding: "5px",
          minHeight: "1rem",
        }}
      >
        {/*erste col*/}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            rowGap: "8px",
            justifyContent: "left",
          }}
        >
          {isMaxYears ? (
            <div style={{ display: "none" }} />
          ) : (
            <AvinocYearsLabel label={getYearsName(props.years)} />
          )}
          <AvinocYearsLabel label={getYearsName(maxYears)} />
        </div>

        {/*zweite col - münzen*/}
        {/*<div*/}
        {/*  style={{*/}
        {/*    display: "flex",*/}
        {/*    flexDirection: "column",*/}
        {/*    justifySelf: "center",*/}
        {/*    alignItems: "center",*/}
        {/*  }}*/}
        {/*>*/}
        {/*  <img*/}
        {/*    src={coins_ic}*/}
        {/*    style={{*/}
        {/*      maxHeight: "40%",*/}
        {/*      maxWidth: "40%",*/}
        {/*      zIndex: "1",*/}
        {/*      position: "relative",*/}
        {/*    }}*/}
        {/*  />*/}
        {/*</div>*/}

        {/*third col AVI*/}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "left",
            rowGap: "8px",
          }}
        >
          {isMaxYears ? (
            <div style={{ display: "none" }} />
          ) : (
            <AvinocRewardLabel label={getRewardLabel(props.years)} />
          )}
          <AvinocRewardLabel label={getRewardLabel(maxYears)} />
        </div>

        {/*vierte col AVI*/}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "center",
            rowGap: "8px",
            flexShrink: "10",
          }}
        >
          {isMaxYears ? (
            <div style={{ display: "none" }} />
          ) : (
            <AvinocDollarRewardLabel
              label={getRewardDollarPrice(props.years)}
            />
          )}
          <AvinocDollarRewardLabel label={getRewardDollarPrice(maxYears)} />
        </div>
      </div>
    </Card>
  );
};

const AvinocYearsLabel: React.FC<{ label: string }> = (props) => {
  return (
    <div
      className={"Col"}
      style={{
        fontWeight: "bold",
        fontSize: "smaller",
      }}
    >
      {props.label}
    </div>
  );
};

const AvinocRewardLabel: React.FC<{ label: string }> = (props) => {
  return (
    <div
      className={"Reward"}
      id={"reward_15"}
      style={{
        fontWeight: "light",
        fontSize: "smaller",
        color: "#252837",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {props.label}
      <img src={avinoc_logo} className={"avi-logo"} />
    </div>
  );
};

const AvinocDollarRewardLabel: React.FC<{ label: string }> = (props) => {
  return (
    <div
      style={{
        fontWeight: "light",
        fontSize: "smaller",
        color: "#B1B1B1",
      }}
    >
      {props.label}
    </div>
  );
};

const BonusBox: React.FC<{ apyLabel: string; networkBonus: boolean }> = (
  props
) => {
  const { t } = useTranslation();

  if (props.networkBonus) {
    return (
      <div
        className="bonus-box"
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-evenly",
          alignItems: "center",
          width: "100%",
          minHeight: "1rem",
          fontWeight: "bold",
          color: "white",
          fontSize: "small",
          background: "linear-gradient(45deg, blue, lightblue)",
          borderRadius: "0px",
        }}
      >
        <div style={{ flexGrow: 50 }} />
        <EmojiEventsIcon />
        <div style={{ flexGrow: 2 }} />
        <div>{t("staking.networkBonus") + ": " + props.apyLabel}</div>
        <div style={{ flexGrow: 50 }} />
      </div>
    );
  } else {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-evenly",
          alignItems: "center",
          width: "100%",
          minHeight: "1rem",
          fontWeight: "bold",
          color: "black",
          fontSize: "small",
          background: "var(--color-warning)",
          borderRadius: "0px",
        }}
      >
        <div style={{ flexGrow: 50 }} />
        <WarningAmberIcon color={"error"} />
        <div style={{ flexGrow: 2 }} />
        <div>{t("staking.networkBonus") + ": " + props.apyLabel}</div>
        <div style={{ flexGrow: 50 }} />
      </div>
    );
  }
};

export default MintingPage;
