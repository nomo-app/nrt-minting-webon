import { CSSProperties } from "react";
import "./MintingPage.css";

export const mintingMainFlexBox: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flexDirection: "column",
  textAlign: "center",
  fontSize: "calc(10px + 1vmin)",
  height: "100vh",
  paddingLeft: "10%",
  paddingRight: "10%",
  background: "url(assets/registrationbackground.svg)",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
  backgroundPosition: "bottom",
  overflowY: "scroll",
};
