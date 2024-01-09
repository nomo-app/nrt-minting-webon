import { CSSProperties } from "react";
import "./ClaimRewardsComponents.css";

export const claimRewardsMainFlexBox: CSSProperties = {
  /* The css variables that are prefixed with "nomo" adjust themselves according to the current Nomo theme */
  background: "linear-gradient(to bottom right, white, var(--nomoBackground))",
  display: "flex",
  flexDirection: "column",
  rowGap: "10px",
  alignContent: "start",
  alignItems: "center",
  textAlign: "center",
  justifyContent: "center",
  fontSize: "calc(10px + 1vmin)",
  height: "100vh",
  width: "100%",
};
