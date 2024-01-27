import React from "react";
// import "@/common/colors.css";
import { formatNRTAmount, formatTokenDollarPrice } from "@/util/use-nrt-price";
import { useTranslation } from "react-i18next";
import { Box, Button, Card, LinearProgress, LinearProgressProps, Typography } from "@mui/material";
import { computeUnclaimedRewards, getCurrentDay, MintingNft } from "@/web3/web3-minting";
import { usePeriodReRender } from "../../../util/util";
import { PageState } from "@/app/minting/logic/MintingPage";
import { isPendingState } from "@/app/claiming/logic/ClaimRewardsPage";
import { nrtIcon, boxLogo, doubleBoxLogo, rocketIcon, nrtStakingIcon } from "@/asset-paths";
import BackButton from "@/common/BackButton";
import "./ClaimRewardsComponents.scss";
import { getLifeCycleDays } from "@/web3/web3-minting";

export const TitleBox: React.FC<{ showBackButton: boolean }> = (props) => {
  const { t } = useTranslation();
  return (
    <div className="title">
      {props.showBackButton && <BackButton />}
      <p>{t("reward.claimRewards")}</p>
    </div>
  );
};

export const ClaimedRewards: React.FC<{
  mintingNFTs: Record<number, MintingNft>;
}> = (props) => {
  const { t } = useTranslation();
  const nftArray: Array<MintingNft> = Object.values(props.mintingNFTs);
  const sumRewards = nftArray.reduce((prev, nft) => prev + nft.claimedRewards, 0n);
  const sumRewardsFormatted = formatNRTAmount({ tokenAmount: sumRewards });
  return (
    <Card
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignContent: "center",
        margin: ".5rem",
      }}
    >
      <div
        style={{
          fontWeight: "Bold",
          fontSize: "14px",
          textAlign: "left",
          flex: "1",
          margin: ".5rem"
        }}
      >
        <p>{t("reward.claimedRewards")}</p>
      </div>
      <div
        style={{
          alignSelf: "center",
          fontSize: "14px",
          textAlign: "right",
          flex: "2",
        }}
      >
        <p>{sumRewardsFormatted}</p>
      </div>
      <img src={nrtIcon} className={"avi-logo"} style={{ padding: "8px", height: "14px", alignSelf: "center" }} />
    </Card>
  );
};

export const ClaimAllButton: React.FC<{
  disabled: boolean;
  onClick: () => void;
}> = (props) => {
  const { t } = useTranslation();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyItems: "center",
        width: "100%",
      }}
    >
      <img
        src={doubleBoxLogo}
        style={{
          height: "65px",
        }}
      />
      <Button
        disabled={props.disabled}
        onClick={() => props.disabled || props.onClick()}
        className={"primary-button"}
        id={"claimButton"}
        style={{
          height: "30px",
          minWidth: "25%",
          marginBottom: "5px",
          maxWidth: "45%",
          backgroundColor: props.disabled ? "gray" : "var(--color-primary-button-background)",
          color: props.disabled ? undefined : "white",
        }}
      >
        {t("reward.claimAll")}
      </Button>
    </div>
  );
};

export const MintingNftBox: React.FC<{
  nrtPrice: number | null;
  mintingNft: MintingNft;
  pageState: PageState;
  onClickClaim: (stakingNft: MintingNft) => void;
}> = (props) => {
  const { t } = useTranslation();
  usePeriodReRender(1000); // frequent re-rendering to show "live updates" of rewards

  const totalRewards: bigint = props.mintingNft.stakedTokens * props.mintingNft.mintingPower / (10n ** 18n);
  const unclaimedRewards: bigint = computeUnclaimedRewards(props.mintingNft);
  const unclaimedRewardsFormatted = formatNRTAmount({
    tokenAmount: unclaimedRewards,
    ultraPrecision: true, // ultraPrecision to see every second that the rewards are increasing
  });

  const currentDay = Math.floor(getCurrentDay(props.mintingNft));
  const progress = Number(currentDay) / Number(getLifeCycleDays(props.mintingNft)) * 100;

  const lifeCycle = Number(getLifeCycleDays(props.mintingNft));

  function onClickClaimClosure() {
    props.onClickClaim(props.mintingNft);
  }
  return (
    <div className="nft-card-container">
      <div className="nft-card-header">
        <div className="header-info">
          <div>{"NFT-ID: #" + props.mintingNft.tokenId}</div>
          <div>{"Linked: " + formatNRTAmount({ tokenAmount: props.mintingNft.stakedTokens })}</div>
        </div>
        <img src={nrtStakingIcon} style={{ width: "50px" }} />
      </div>

      <div className="nft-card-body">
        <p>{t("reward.totalPayout") + ": " + formatNRTAmount({ tokenAmount: totalRewards })}</p>
        <p>{"Minting Power: " + Number(props.mintingNft.mintingPower) / 1e18}</p>
        <p>{"Quantity: " + (Number(props.mintingNft.quantity) / 1e18)}</p>
      </div>

      <div className="nft-card-loading-bar">
        <LinearProgressWithLabel
          value={progress}
          currentDay={currentDay}
          lifeCycle={lifeCycle}
        />
      </div>

      <div className="nft-card-footer">
        <div className="unclaimed-rewards">
          <div>
            <p>{t("reward.unclaimedRewards")}</p>
          </div>
          <div>
            <p>
              {unclaimedRewardsFormatted}
            </p>
            <p>
              {formatTokenDollarPrice({
                tokenPrice: props.nrtPrice,
                tokenAmount: unclaimedRewards,
              })}
            </p>
          </div>
        </div>
      </div>

      {props.mintingNft.stakedTokens === 0n ? <div className="nft-not-linked">No tokens linked</div> : <ClaimButton disabled={isPendingState(props.pageState as any)} onClick={onClickClaimClosure} />}
    </div>
  );
};

export const ClaimButton: React.FC<{
  disabled: boolean;
  onClick: () => void;
}> = (props) => {
  const { t } = useTranslation();
  return (
    <Button
      disabled={props.disabled}
      onClick={() => props.disabled || props.onClick()}
      style={{ margin: ".5rem", border: "1px solid #23c1c4", color: "white", fontWeight: "bold" }}
    >
      {t("reward.claim")}
    </Button>
  );
};

const LinearProgressWithLabel: React.FC<{ value: number, currentDay: number, lifeCycle: number }> = (props) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        margin: "0.5rem",
      }}
    >
      <Box sx={{ width: "100%", mr: 1 }}>
        <LinearProgress
          style={{
            height: "25px",
            borderRadius: "6px",
          }}
          variant="determinate"
          value={props.value}
          sx={{
            backgroundColor: "var(--color-primary-light)",
            "& .MuiLinearProgress-bar": {
              backgroundColor: "var(--color-primary-button-background)",
            },
          }}
        />
      </Box>
      <Box sx={{ minWidth: 35, display: "flex", justifyContent: "center" }}>
        <Typography variant="body2" color="white">
          {`${props.currentDay}/` + `${props.lifeCycle} Days`}
        </Typography>
      </Box>
    </Box>
  );
};
