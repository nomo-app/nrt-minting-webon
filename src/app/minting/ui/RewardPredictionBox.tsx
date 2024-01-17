import { Card } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { BonusBox } from "./MintingComponents";
import { AvinocDollarRewardLabel } from "./MintingComponents";
import { MintingRewardLabel } from "./MintingComponents";
import { MintingYearsLabel } from "./MintingComponents";
import "./RewardPredicionBox.scss";

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
      }}
      sx={{
        backgroundColor: "#13111a",
      }}
    >
      {/*row 1 network bonus*/}
      <BonusBox apyLabel={apyLabel} networkBonus={props.networkBonus} />

      {/*ro2 your rewards */}
      <div className="reward-information-container">
        <div className="reward-information">
          <MintingYearsLabel label={"Daily"} />
          <MintingRewardLabel label={"+ 3.33 NRT"} />
          <AvinocDollarRewardLabel label={"$0.49"} />
        </div>
        <div className="reward-information">
          <MintingYearsLabel label={"After 720 days"} />       
          <MintingRewardLabel label={"+ " + 1000 * 2.4 + " NRT"} />
          <AvinocDollarRewardLabel label={"$360.0"} />
        </div>
      </div>
    </Card>
  );
};
