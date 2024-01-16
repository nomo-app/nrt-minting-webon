
import * as React from "react";
import "@/common/colors.css";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Slide from "@mui/material/Slide";
import { TransitionProps } from "@mui/material/transitions";
import { useTranslation } from "react-i18next";
import CheckIcon from "@mui/icons-material/Check";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import { getApyValues } from "../logic/staking-rewards";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import { avinocIcon } from "@/asset-paths";
import { formatNRTAmount } from "@/util/use-avinoc-price";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const ConfirmDialogSlide: React.FC<{
  isOpen: boolean;
  years: bigint;
  selectedAmount: bigint;
  networkBonus: boolean;
  handleClose: () => void;
  handleConfirm: () => void;
}> = (props) => {
  const { t } = useTranslation();

  function getYearText(): string {
    if (props.years === 1n) {
      return t("staking.year");
    } else {
      return t("staking.years");
    }
  }

  const visibleSelectedAmount = formatNRTAmount({
    tokenAmount: props.selectedAmount,
  });

  return (
    <Dialog
      open={props.isOpen}
      TransitionComponent={Transition}
      keepMounted
      onClose={props.handleClose}
      aria-describedby="alert-dialog-slide-description"
    >
      <div
        style={{
          textAlign: "center",
          background: "url(assets/registrationbackground.svg)",
          backgroundRepeat: "no-repeat",
          backgroundSize: "100%",
        }}
      >
        <DialogTitle>
          {t("staking.dialogConfirm")}
          <IconButton
            aria-label="close"
            onClick={props.handleClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "gray",
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <div
            style={{
              zIndex: "1",
              fontSize: "small",
              alignItems: "center",
              display: "flex",
              justifyContent: "center",
            }}
            id="alert-dialog-slide-description"
          >
            {t("staking.amount")}: {visibleSelectedAmount}
            <img
              src={avinocIcon}
              className={"avi-logo"}
              style={{ height: "12px" }}
            />
          </div>

          <div
            style={{
              zIndex: "1",
              textAlign: "center",
              fontSize: "small",
              marginBottom: "14px",
            }}
          >
            {t("reward.stakingPeriod")}: {props.years.toString()}{" "}
            {getYearText()}
          </div>

          <div
            style={{
              fontSize: "small",
              display: "flex",
            }}
            id="alert-dialog-slide-description"
          >
            <CheckBoxNetwork networkBonus={!props.networkBonus} />
            <div style={{ flexGrow: 1, textAlign: "left", marginRight: "2px" }}>
              {t("staking.apyWithoutBonus")}:{" "}
            </div>
            <div>{getApyValues(props.years).apyWithoutBonus * 100} %</div>
          </div>

          <div
            style={{
              fontSize: "small",
              marginBottom: "5px",
              display: "flex",
            }}
            id="alert-dialog-slide-description"
          >
            <CheckBoxNetwork networkBonus={props.networkBonus} />
            <div style={{ flexGrow: 1, textAlign: "left", marginRight: "2px" }}>
              {t("staking.apyWithBonus")}:{" "}
            </div>
            <div>{getApyValues(props.years).apyWithBonus * 100} %</div>
          </div>
        </DialogContent>
        <div>
          <AlertDialog networkBonus={props.networkBonus} />
        </div>

        <DialogActions>
          <Button
            style={{
              padding: "2%",
              backgroundColor: "var(--color-primary-button-background)",
              color: "white",
              border: "none",
              borderRadius: "5px",
              width: "100%",
              height: "50px",
              alignSelf: "center",
              margin: "20px",
              fontSize: "small",
              fontWeight: "bold",
              transition: "ease-in-out all 0.3s",
            }}
            onClick={props.handleConfirm}
          >
            {"Stake"}
          </Button>
        </DialogActions>
      </div>
    </Dialog>
  );
};

const AlertDialog: React.FC<{ networkBonus: boolean }> = (props) => {
  const { t } = useTranslation();

  if (props.networkBonus) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "row",
        }}
      >
        <CheckIcon
          style={{ color: "var(--color-primary-button-background)" }}
        />
        <div
          style={{
            fontSize: "small",
            color: "var(--color-primary-button-background)",
          }}
        >
          {t("staking.networkBonusEnabled")}
        </div>
      </div>
    );
  } else {
    return (
      <div
        style={{
          backgroundColor: "var(--color-warning)",
          padding: "12px",
          fontSize: "small",
          fontWeight: "bold",
        }}
      >
        {t("staking.networkBonusWarning")}
      </div>
    );
  }
};

const CheckBoxNetwork: React.FC<{ networkBonus: boolean }> = (props) => {
  if (props.networkBonus) {
    return <CheckBoxIcon style={{ height: "15px" }} />;
  } else {
    return (
      <CheckBoxOutlineBlankIcon sx={{ height: "15px", colorScheme: "black" }} />
    );
  }
};
