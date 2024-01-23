import { Card } from "@mui/material";
import React from "react";
import { BonusBox } from "./MintingComponents";
import { NRTDollarRewardLabel } from "./MintingComponents";
import { MintingRewardLabel } from "./MintingComponents";
import { MintingYearsLabel } from "./MintingComponents";
import "./RewardPredicionBox.scss";
import { formatNRTAmount, formatTokenDollarPrice } from "@/util/use-nrt-price";

export const RewardPredictionBox: React.FC<{
  nrtAmount: bigint;
  nrtPrice: number | null;
  nrtMintingPower: bigint
}> = (props) => {
  const totalRewards = props.nrtAmount * props.nrtMintingPower / 100n;
  const dailyRewards = totalRewards / 720n;

  return (
    <Card
      variant={"elevation"}
      elevation={0}
      style={{
        width: "100%",
        margin: "0.5rem",
        display: "flex",
        flexDirection: "column",
      }}
      sx={{
        backgroundColor: "#13111a",
      }}
    >
      {/*row 1 network bonus*/}
      <BonusBox />

      {/*ro2 your rewards */}
      <div className="reward-information-container">
        <div className="reward-information">
          <MintingYearsLabel label={"Daily"} />
          <MintingRewardLabel label={`+ ${formatNRTAmount({tokenAmount: dailyRewards}).replace(' ZEN20', '')}`} />
          <NRTDollarRewardLabel label={formatTokenDollarPrice({ tokenPrice: props.nrtPrice, tokenAmount: dailyRewards })} />
        </div>
        <div className="reward-information">
          <MintingYearsLabel label={"After 720 days"} />       
          <MintingRewardLabel label={`+ ${formatNRTAmount({tokenAmount: totalRewards}).replace(' ZEN20', '')}`} />
          <NRTDollarRewardLabel label={formatTokenDollarPrice({ tokenPrice: props.nrtPrice, tokenAmount: totalRewards })} />
        </div>
      </div>
    </Card>
  );
};
