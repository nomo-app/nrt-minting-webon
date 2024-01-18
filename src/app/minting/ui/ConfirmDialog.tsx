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
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import { nrtIcon } from "@/asset-paths";
import { formatNRTAmount } from "@/util/use-nrt-price";
import { MintingPlan } from "@/web3/minting-plan";

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
  mintingPlan: MintingPlan;
  handleClose: () => void;
  handleConfirm: () => void;
}> = (props) => {
  const { t } = useTranslation();

  const visibleSelectedAmount = formatNRTAmount({
    tokenAmount: props.mintingPlan.totalAmountToLink,
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
          fontFamily: "Helvetica",
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
              src={nrtIcon}
              className={"avi-logo"}
              style={{ height: "12px", paddingLeft: "5px" }}
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
            {t("reward.stakingPeriod") + ": "}
            {" 720 Days"}
          </div>

          <div
            style={{
              fontSize: "small",
              display: "flex",
            }}
            id="alert-dialog-slide-description"
          >
            {"Minting plan details:"}
          </div>
          {props.mintingPlan.mintingOps.map((mintingOp, _) => (
            <div
              style={{
                fontSize: "small",
                display: "flex",
                textAlign: "left",
              }}
              id="alert-dialog-slide-description"
              key={mintingOp.nft.tokenId.toString()}
            >
              {formatNRTAmount({ tokenAmount: mintingOp.amountToLink }) +
                " on NRT Power Node #" +
                mintingOp.nft.tokenId.toString() +
                " with minting power " +
                (Number(mintingOp.nft.mintingPower) / 100).toString()}
            </div>
          ))}
        </DialogContent>

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
              margin: "10px",
              fontSize: "small",
              fontWeight: "bold",
              transition: "ease-in-out all 0.3s",
            }}
            onClick={props.handleConfirm}
          >
            {"Link and Mint!"}
          </Button>
        </DialogActions>
      </div>
    </Dialog>
  );
};
