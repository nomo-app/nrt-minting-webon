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

import { nrtIcon, nrtMigrationIcon } from "@/asset-paths";
import { PageState } from "../logic/MintingPage";
import { getTokenStandard, navigateToClaimingPage } from "@/web3/navigation";
import { formatNRTAmount } from "@/util/use-nrt-price";
import { useNavigate } from "react-router-dom";
import "./MintingComponents.scss";

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
      case "ERROR_INSUFFICIENT_NRT":
      case "ERROR_FETCH_FAILED":
      case "ERROR_MISSING_WALLET_BACKUP":
      case "ERROR_TX_FAILED":
      case "ERROR_INSUFFICIENT_RESERVES":
      case "ERROR_LIMIT_EXCEEDED":
      case "PENDING_SUBMIT_TX":
        return t("status." + props.pageState);
      case "ERROR_NO_POWER_NRT_POWER_NODES":
        return "No NRT Power Nodes were found in this wallet.";
      case "ERROR_MAX_LINKABLE_AMOUNT":
        return "Maximum linkable amount exceeded.";
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
      className="minting-page-button"
      disabled={props.disabled}
      onClick={() => props.disabled || props.onClick()}
      style={{
        color: props.disabled ? "white" : undefined,
        backgroundColor: props.disabled ? "grey" : "#23c1c4",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          fontSize: "large",
          fontWeight: "bold",
        }}
      >
        {props.disabled ? (
          <CircularProgress style={{ height: "22px", width: "22px" }} />
        ) : (
          <div />
        )}
        {"Link NRT"}
      </div>
    </button>
  );
};

export const SwitchToRewardPageButton: React.FC<{
  disabled: boolean;
}> = (props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  function onClick() {
    navigateToClaimingPage(navigate);
  }

  return (
    <button
      className="reward-page-button"
      disabled={props.disabled}
      onClick={() => props.disabled || onClick()}
      style={{
        color: props.disabled ? "grey" : undefined,
        backgroundColor: props.disabled ? "grey" : "#2c04fe",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          fontSize: "large",
          fontWeight: "bold",
        }}
      >
        {t("staking.claimRewards")}
      </div>
    </button>
  );
};
export const MintingTitleBar: React.FC = () => {
  const tokenStandard = getTokenStandard();
  const titleText = "NEO Credit DeFi";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src={nrtMigrationIcon}
        alt="logo"
        style={{ width: 75, height: 75 }}
      />
      <div
        style={{
          fontWeight: "bold",
          fontSize: "x-large",
          fontFamily: "Helvetica",
        }}
      >
        {/* {"NRT " + tokenStandard + " Minting"} */}
        {titleText}
      </div>
    </div>
  );
};

const INPUT_ERROR_TRHESHOLD = -2n;

export const TokenAmountInput: React.FC<{
  onChange: (value: bigint) => void;
  value: bigint;
  nrtBalance: bigint | null;
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
    const floatValue: number = parseFloat(valueString) * 1e8;
    if (isNaN(floatValue)) {
      return;
    }
    const bigintValue = BigInt(Math.floor(floatValue));
    console.log("bigintValue", bigintValue);

    props.onChange(bigintValue);
  };

  const availableText =
    props.nrtBalance !== null && props.nrtBalance !== undefined
      ? `Available in wallet: ${formatNRTAmount({
          tokenAmount: props.nrtBalance,
        })}`
      : t("staking.loadBalance");

  const isError = props.value <= INPUT_ERROR_TRHESHOLD;

  const userVisibleProp = props.value >= 0 ? Number(props.value) / 1e8 : "";

  return (
    <TextField
      id="textfield_outline"
      helperText={availableText.replace("ZEN20", "")}
      label={t("staking.amountMinting")}
      variant="outlined"
      type={"number"}
      style={{
        width: "90%",
        marginLeft: "1rem",
        marginRight: "1rem",
        marginTop: "1rem",
      }}
      sx={{
        input: { color: "white" },
        label: { color: "#23c1c4" },
        "& .MuiOutlinedInput-root": {
          "& fieldset": {
            borderColor: "white",
          },
          "&:hover fieldset": {
            borderColor: "white",
          },
          "&.Mui-focused fieldset": {
            borderColor: "white",
          },
        },
        "& .MuiFormHelperText-root": {
          color: "white",
          fontSize: "small",
          fontWeight: "bold",
          textAlign: "center",
          marginTop: "0.5rem",
        },
        "& .MuiInput-underline:before": {
          // underline color when textfield is not focused
          borderBottomColor: "white",
        },
        "& .MuiInput-underline:after": {
          // underline color when textfield is focused
          borderBottomColor: "white",
        },
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
            <div
              id={"max_button"}
              className={"MaxButton"}
              style={{ color: "#23c1c4" }}
            >
              MAX
            </div>
          </InputAdornment>
        ),
        startAdornment: (
          <InputAdornment position="start">
            <img
              src={nrtIcon}
              className="Zeniq-Logo"
              alt="logo"
              style={{ width: 25, height: 25 }}
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
      variant={"outlined"}
      sx={{ m: 1 }}
      style={{ width: "90%", marginTop: "2rem", marginBottom: "2rem" }}
    >
      <InputLabel
        id="stakingTimeTitle"
        sx={{
          color: "white",
          "&::before": { borderBottomColor: "white" },
          "&::after": { borderBottomColor: "white" },
        }}
      >
        {t("reward.stakingPeriod")}
      </InputLabel>
      <Select
        label="Minting Time"
        value={"" + 720}
        onChange={props.onChange}
        style={{ fontWeight: "bold" }}
        sx={{
          color: "white",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "white",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "white",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "white",
          },
          "& .MuiSvgIcon-root": {
            // Directly targeting the SVG icon
            fill: "white!important",
          },
        }}
      >
        <MenuItem value={720}>{"720 Days"}</MenuItem>
        {/*<MenuItem value={15}>{"15 " + t("staking.years")}</MenuItem>*/}
      </Select>
    </FormControl>
  );
};
export const MintingYearsLabel: React.FC<{ label: string }> = (props) => {
  return (
    <div
      style={{
        flex: 2,
        color: "white",
      }}
    >
      {props.label}
    </div>
  );
};
export const MintingRewardLabel: React.FC<{ label: string }> = (props) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "end",
        flex: 2,
        color: "white",
      }}
    >
      {props.label}
    </div>
  );
};

export const NRTDollarRewardLabel: React.FC<{ label: string }> = (props) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "end",
        flex: 1,
        color: "white",
      }}
    >
      {props.label}
    </div>
  );
};

export const BonusBox: React.FC = () => {
  return (
    <div
      className="bonus-box"
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        minHeight: "1rem",
        fontWeight: "bold",
        color: "white",
        fontSize: "small",
        background: "linear-gradient(45deg, #1f2124, #494c56)",
        borderRadius: ".5rem",
        padding: ".5rem",
        fontFamily: "Helvetica",
      }}
    >
      <div>{"Minting Rewards"}</div>
    </div>
  );
};
