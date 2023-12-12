"use client";

import "@/util/i18n"; // needed to initialize i18next
import React, { useEffect } from "react";
import "@/common/colors.css";
import { useAvinocPrice } from "../../../util/use-avinoc-price";
import { useTranslation } from "react-i18next";
import { Alert, Card, CircularProgress } from "@mui/material";
import { CongratDialogSlide } from "@/app/minting/ui/CongratDialog";
import {
  fetchOwnedTokenIDs,
  fetchStakingNft,
  StakingNft,
  submitClaimTransaction,
} from "@/web3/web3-minting";
import { UnreachableCaseError } from "../../../util/typesafe";
import { useEvmAddress } from "@/web3/web3-common";
import {
  ClaimAllButton,
  ClaimedRewards,
  StakingNftBox,
  TitleBox,
} from "../ui/ClaimRewardsComponents";
import { usePreventServerSideRendering } from "@/util/util";
import { claimRewardsMainFlexBox } from "../ui/claim-style";

export type PageState =
  | "PENDING_TOKENID_FETCH"
  | "PENDING_DETAILS_FETCH"
  | "PENDING_SUBMIT_TX"
  | "IDLE"
  | "ERROR_NO_NFTS_CLAIM"
  | "ERROR_INSUFFICIENT_ETH"
  | "ERROR_TX_FAILED"
  | "ERROR_FETCH_FAILED";

export function isPendingState(pageState: PageState) {
  return pageState.startsWith("PENDING");
}

export function isErrorState(pageState: PageState) {
  return pageState.startsWith("ERROR");
}

const ClaimRewardsPage: React.FC = () => {
  const { isClient } = usePreventServerSideRendering();

  const { evmAddress } = useEvmAddress();
  const { avinocPrice } = useAvinocPrice();
  const [pageState, setPageState] = React.useState<PageState>(
    "PENDING_TOKENID_FETCH"
  );
  const [tokenIDs, setTokenIDs] = React.useState<Array<number>>([]);
  const [stakingNFTs, setStakingNFTs] = React.useState<
    Record<string, StakingNft>
  >({});
  const [congratDialogOpen, setCongratDialogOpen] = React.useState(false);

  useEffect(() => {
    if (evmAddress) {
      fetchOwnedTokenIDs({ ethAddress: evmAddress })
        .then((tokenIDs: any) => {
          if (tokenIDs.length) {
            setPageState("PENDING_DETAILS_FETCH");
          } else {
            setPageState("ERROR_NO_NFTS_CLAIM");
          }
          setTokenIDs(tokenIDs);
        })
        .catch((e) => {
          console.error(e);
          setPageState("ERROR_FETCH_FAILED");
        });
    }
  }, [evmAddress]);

  useEffect(() => {
    tokenIDs.forEach((tokenId) => {
      fetchStakingNft({ tokenId })
        .then((stakingNft: any) => {
          setStakingNFTs((prevStakingNFTs) => {
            return {
              ...prevStakingNFTs,
              ["" + tokenId]: stakingNft,
            };
          });
          setPageState("IDLE");
        })
        .catch((e: any) => {
          setPageState("ERROR_FETCH_FAILED");
          console.error(e);
        });
    });
  }, [tokenIDs]);

  function refreshOnChainData() {
    console.log("Refreshing on-chain data...");
    setTokenIDs([...tokenIDs]);
  }

  function doClaim(args: { tokenIDs: Array<number> }) {
    if (!evmAddress) {
      setPageState("ERROR_INSUFFICIENT_ETH");
      return;
    }
    setPageState("PENDING_SUBMIT_TX");
    submitClaimTransaction({ tokenIDs: args.tokenIDs, ethAddress: evmAddress })
      .then((error: any) => {
        if (error) {
          setPageState(error);
        } else {
          setPageState("IDLE");
          setCongratDialogOpen(true);
        }
      })
      .catch((e) => {
        setPageState("ERROR_TX_FAILED");
        console.error(e);
      });
  }

  function onClickClaim(stakingNft: StakingNft) {
    doClaim({ tokenIDs: [stakingNft.tokenId] });
  }

  function onClickClaimAll() {
    const tokenIDs = Object.keys(stakingNFTs).map((str) => parseInt(str));
    if (tokenIDs.length) {
      doClaim({ tokenIDs });
    }
  }

  if (!isClient) {
    return <div />;
  }
  return (
    <div style={claimRewardsMainFlexBox}>
      <div style={{ flexGrow: "10" }} />
      <TitleBox />
      <div className={"scroll-container"}>
        {Object.values(stakingNFTs).map((stakingNft) => {
          return (
            <StakingNftBox
              key={stakingNft.tokenId}
              avinocPrice={avinocPrice}
              stakingNft={stakingNft}
              pageState={pageState as any}
              onClickClaim={onClickClaim}
            />
          );
        })}
      </div>

      <Card
        style={{
          display: Object.values(stakingNFTs).length >= 2 ? undefined : "none",
          width: "90%",
          height: "fit-content",
        }}
      >
        <ClaimAllButton
          disabled={isPendingState(pageState)}
          onClick={onClickClaimAll}
        />
      </Card>

      {pageState === "IDLE" ? (
        <ClaimedRewards stakingNFTs={stakingNFTs} />
      ) : (
        <StatusBox pageState={pageState} />
      )}

      <CongratDialogSlide
        isOpen={congratDialogOpen}
        handleClose={() => {
          setCongratDialogOpen(false);
          refreshOnChainData();
        }}
        translationKey={"reward.DialogSuccess"}
      />
      <div style={{ flexGrow: "50" }} />
    </div>
  );
};

const StatusBox: React.FC<{ pageState: PageState }> = (props) => {
  const { t } = useTranslation();
  function getStatusMessage() {
    switch (props.pageState) {
      case "ERROR_FETCH_FAILED":
      case "ERROR_TX_FAILED":
      case "ERROR_NO_NFTS_CLAIM":
      case "ERROR_INSUFFICIENT_ETH":
      case "PENDING_DETAILS_FETCH":
      case "PENDING_TOKENID_FETCH":
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

export default ClaimRewardsPage;
