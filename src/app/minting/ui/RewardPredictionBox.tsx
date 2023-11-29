import { Card } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { getApyValues } from "@/app/minting/logic/staking-rewards";
import { BonusBox } from "./MintingComponents";
import { AvinocDollarRewardLabel } from "./MintingComponents";
import { AvinocRewardLabel } from "./MintingComponents";
import { AvinocYearsLabel } from "./MintingComponents";

export const RewardPredictionBox: React.FC<{
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
    ? "+" + 100 * getApy(props.years) + "%"
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
