import { Card } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { BonusBox } from "./MintingComponents";
import { AvinocDollarRewardLabel } from "./MintingComponents";
import { MintingRewardLabel } from "./MintingComponents";
import { MintingYearsLabel } from "./MintingComponents";

export const RewardPredictionBox: React.FC<{
  avinocAmount: bigint;
  avinocPrice: number | null;
  networkBonus: boolean;
}> = (props) => {
  const { t } = useTranslation();

  function getApy(): number {
    return 2.6;
  }

  const apyLabel = props.networkBonus
    ? "+" + 100 * getApy() + "%"
    : t("reward.disabled");

  return (
    <Card
      variant={"elevation"}
      elevation={0}
      style={{
        width: "100%",
        margin: "1rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
      sx={{
        backgroundColor: "#13111a",
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
          padding: "1rem",
          minHeight: "1rem",
          color: "white",
          marginTop: ".25rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            rowGap: ".5rem",
            justifyContent: "left",
            fontSize: "1rem",
          }}
        >
          <MintingYearsLabel label={"Daily rewards"} />
          <MintingYearsLabel label={"Rewards after 720 days"} />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "left",
            rowGap: ".5rem",
          }}
        >
          <MintingRewardLabel label={"+ 3.33 NRT Daily"} />
          <MintingRewardLabel label={"+ " + 1000 * 2.4 + " NRT Total"} />
        </div>

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
          <AvinocDollarRewardLabel label={"$0.49"} />
          <AvinocDollarRewardLabel label={"$360"} />
        </div>
      </div>
    </Card>
  );
};
