import React from "react";
import "@/common/colors.css";
import { formatTokenDollarPrice } from "@/util/use-avinoc-price";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Card,
  LinearProgress,
  LinearProgressProps,
  Typography,
} from "@mui/material";
import { computeUnclaimedRewards, StakingNft } from "@/web3/web3-minting";
import { usePeriodReRender } from "../../../util/util";
import { PageState } from "@/app/minting/logic/MintingPage";
import { isPendingState } from "@/app/claiming/logic/ClaimRewardsPage";
import { avinocIcon, boxLogo, doubleBoxLogo, rocketIcon } from "@/asset-paths";
import BackButton from "@/common/BackButton";

export const TitleBox: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        fontSize: "large",
        fontWeight: "bold",
      }}
    >
      <BackButton />
      {t("reward.claimRewards")}
    </div>
  );
};

export const ClaimedRewards: React.FC<{
  stakingNFTs: Record<number, StakingNft>;
}> = (props) => {
  const { t } = useTranslation();
  const nftArray: Array<StakingNft> = Object.values(props.stakingNFTs);
  const sumRewards = nftArray.reduce(
    (prev, nft) => prev + nft.claimedRewards,
    0
  );
  return (
    <Card
      style={{
        width: "90%",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignContent: "center",
        height: "fit-content",
        margin: "0.5rem",
      }}
    >
      <img
        src={rocketIcon}
        style={{ padding: "8px", height: "14px", alignSelf: "center" }}
      />
      <div
        style={{
          fontWeight: "Bold",
          fontSize: "14px",
          textAlign: "left",
          flex: "2",
        }}
      >
        <p>{t("reward.claimedRewards")}</p>
      </div>
      <div
        style={{
          fontSize: "14px",
          textAlign: "right",
          flex: "1",
        }}
      >
        <p>{sumRewards.toFixed(2)}</p>
      </div>
      <img
        src={avinocIcon}
        className={"avi-logo"}
        style={{ padding: "8px", height: "14px", alignSelf: "center" }}
      />
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
          backgroundColor: props.disabled
            ? "gray"
            : "var(--color-primary-button-background)",
          color: props.disabled ? undefined : "white",
        }}
      >
        {t("reward.claimAll")}
      </Button>
    </div>
  );
};

export const StakingNftBox: React.FC<{
  avinocPrice: number | null;
  stakingNft: StakingNft;
  pageState: PageState;
  onClickClaim: (stakingNft: StakingNft) => void;
}> = (props) => {
  const { t } = useTranslation();
  usePeriodReRender(1000);

  const totalRewards = props.stakingNft.amount * props.stakingNft.payoutFactor;
  const unclaimedRewards = computeUnclaimedRewards(props.stakingNft);
  const progress =
    (100.0 * (props.stakingNft.claimedRewards + unclaimedRewards)) /
    totalRewards;
  const stakingPeriod = `${props.stakingNft.start.toLocaleDateString()} - ${props.stakingNft.end.toLocaleDateString()}`;
  const years =
    props.stakingNft.end.getFullYear() - props.stakingNft.start.getFullYear();
  const avinocPerDay = totalRewards / (years * 365);

  function onClickClaimClosure() {
    props.onClickClaim(props.stakingNft);
  }
  return (
    <Card
      style={{
        padding: "4px",
        height: "fit-content",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          width: "100%",
          paddingBottom: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            width: "100%",
            flex: "1.5",
            marginLeft: "1%",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              textAlign: "start",
              fontWeight: "bolder",
            }}
          >
            {"Staked: " + props.stakingNft.amount + " AVINOC"}
          </div>
          <div
            style={{
              textAlign: "start",
              fontWeight: "lighter",
              fontSize: "14px",
            }}
          >
            {t("reward.totalPayout") + ": " + totalRewards + " AVINOC"}
          </div>
          <div
            style={{
              textAlign: "start",
              fontWeight: "lighter",
              fontSize: "14px",
            }}
          >
            {avinocPerDay.toPrecision(4) + " AVINOC/" + t("generic.day")}
          </div>
          <div style={{ fontWeight: "lighter", fontSize: "14px" }}>
            {"APY: " + props.stakingNft.apy + "%"}
          </div>
          <div
            style={{
              fontWeight: "lighter",
              fontSize: "14px",
              textAlign: "start",
            }}
          >
            {t("reward.stakingPeriod")}: {stakingPeriod}{" "}
          </div>
        </div>
        <img
          src={boxLogo}
          style={{
            width: "75px",
            zIndex: "1",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
          rowGap: "10px",
          alignItems: "center",
          width: "100%",
          marginLeft: "1%",
        }}
      >
        <div
          style={{
            alignSelf: "flex-start",
            width: "95%",
          }}
        >
          <LinearProgressWithLabel
            value={progress}
            sx={{
              backgroundColor: "var(--color-primary-light)",
              "& .MuiLinearProgress-bar": {
                backgroundColor: "var(--color-primary-button-background)",
              },
            }}
          />
        </div>

        {/*row - unclaimed rewards and claim-button */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifySelf: "bottom",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontWeight: "Bold",
                fontSize: "small",
              }}
            >
              {t("reward.unclaimedRewards")}
            </div>
            <div style={{ fontSize: "14px" }}>
              {unclaimedRewards.toFixed(6) + " AVINOC"}{" "}
            </div>
            <div style={{ fontSize: "14px", color: "gray" }}>
              {formatTokenDollarPrice({
                tokenPrice: props.avinocPrice,
                tokenAmount: Number(unclaimedRewards),
              })}
            </div>
          </div>
          <div style={{ flexGrow: "20" }} />
          <ClaimButton
            disabled={isPendingState(props.pageState as any)}
            onClick={onClickClaimClosure}
          />
          <div style={{ flexGrow: "3" }} />
        </div>
      </div>
    </Card>
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
      className={"primary-button"}
      id={"claimButton"}
      style={{
        marginTop: "10px",
        marginRight: "5px",
        height: "30px",
        minWidth: "10%",
        maxWidth: "40%",
        backgroundColor: props.disabled
          ? "gray"
          : "var(--color-primary-button-background)",
        color: props.disabled ? undefined : "white",
      }}
    >
      {t("reward.claim")}
    </Button>
  );
};

const LinearProgressWithLabel: React.FC<
  LinearProgressProps & { value: number }
> = (props) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-evenly",
      }}
    >
      <Box sx={{ width: "100%", mr: 1 }}>
        <LinearProgress
          style={{
            height: "25px",
            borderRadius: "6px",
          }}
          variant="determinate"
          {...props}
        />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography
          variant="body2"
          color="text.secondary"
        >{`${props.value.toPrecision(3)}%`}</Typography>
      </Box>
    </Box>
  );
};
