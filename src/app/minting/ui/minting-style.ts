import { CSSProperties } from "react";
import "./MintingPage.css";

export const mintingMainFlexBox: CSSProperties = {
  /* The css variables that are prefixed with "nomo" adjust themselves according to the current Nomo theme */
  background: "linear-gradient(to bottom right, white, var(--nomoBackground))",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flexDirection: "column",
  textAlign: "center",
  fontSize: "calc(10px + 1vmin)",
  height: "100vh",
  paddingLeft: "10%",
  paddingRight: "10%",
  overflowY: "scroll",
};
