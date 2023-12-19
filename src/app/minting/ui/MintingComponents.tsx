import {
  Alert,
  CircularProgress,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { UnreachableCaseError } from "@/util/typesafe";

import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { avinocIcon, stakingIcon } from "@/asset-paths";
import { PageState } from "../logic/MintingPage";
import BackButton from "@/common/BackButton";
import { getTokenStandard, navigateToClaimingPage } from "@/web3/navigation";
import { formatAVINOCAmount } from "@/util/use-avinoc-price";
import { useRouter } from "next/navigation";

export function isErrorState(pageState: PageState) {
  return pageState.startsWith("ERROR");
}

export const StatusBox: React.FC<{ pageState: PageState }> = (props) => {
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

export const StakeButton: React.FC<{
  disabled: boolean;
  onClick: () => void;
}> = (props) => {
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
        <img src={stakingIcon} alt={""} height={"14px"} />
        {"Stake " + getTokenStandard()}
      </div>
    </button>
  );
};

export const SwitchToRewardPageButton: React.FC<{
  disabled: boolean;
}> = (props) => {
  const { t } = useTranslation();
  const router = useRouter();

  function onClick() {
    navigateToClaimingPage(router);
  }

  return (
    <a onClick={props.disabled ? undefined : onClick} style={{ width: "100%" }}>
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
export const StakingTitleBar: React.FC = () => {
  const tokenStandard = getTokenStandard();

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
      <BackButton />
      <div style={{ flexGrow: 11 }} />
      <img
        src={avinocIcon}
        className="Avinoc-Hex"
        alt="hex"
        style={{
          width: "10%",
        }}
      />
      <div style={{ flexGrow: 1 }} />
      <div style={{ fontWeight: "bold", fontSize: "large" }}>
        {"AVINOC " + tokenStandard + " Staking"}
      </div>
      <div style={{ flexGrow: 15 }} />
    </div>
  );
};

const INPUT_ERROR_TRHESHOLD = -2n;

export const AvinocAmountInput: React.FC<{
  onChange: (value: bigint) => void;
  value: bigint;
  maxValue: bigint | null;
}> = (props) => {
  const { t } = useTranslation();

  const onChangeWrapper = (event: any) => {
    const rawString: string = event.target.value ?? "";
    console.log("rawString", rawString);
    if (typeof rawString !== "string") {
      return;
    }
    if (rawString === "") {
      props.onChange(INPUT_ERROR_TRHESHOLD);
      return;
    }
    const valueString = rawString.trim();
    const floatValue: number = parseFloat(valueString) * 1e18;
    if (isNaN(floatValue)) {
      return;
    }
    const bigintValue = BigInt(Math.floor(floatValue));
    console.log("bigintValue", bigintValue);

    props.onChange(bigintValue);
  };

  const availableText =
    props.maxValue !== null && props.maxValue !== undefined
      ? `${t("staking.available")}: ${formatAVINOCAmount({
          tokenAmount: props.maxValue,
        })}`
      : t("staking.loadBalance");

  const isError = props.value <= INPUT_ERROR_TRHESHOLD;

  const userVisibleProp = props.value >= 0 ? Number(props.value) / 1e18 : "";

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
      value={userVisibleProp}
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
              src={avinocIcon}
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
export const SelectYears: React.FC<{
  years: bigint;
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
export const AvinocYearsLabel: React.FC<{ label: string }> = (props) => {
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
export const AvinocRewardLabel: React.FC<{ label: string }> = (props) => {
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
      <img src={avinocIcon} className={"avi-logo"} />
    </div>
  );
};

export const AvinocDollarRewardLabel: React.FC<{ label: string }> = (props) => {
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

export const BonusBox: React.FC<{ apyLabel: string; networkBonus: boolean }> = (
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
