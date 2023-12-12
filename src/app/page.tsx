"use client";

import "@/util/i18n"; // needed to initialize i18next
import { StakingTitleBar } from "./minting/ui/MintingComponents";
import { usePreventServerSideRendering } from "@/util/util";
import { stakingIcon } from "@/asset-paths";
import { mintingMainFlexBox } from "./minting/ui/minting-style";
import { useEffect } from "react";
import {
  NomoTheme,
  getCurrentNomoTheme,
  injectNomoCSSVariables,
  switchNomoTheme,
} from "nomo-webon-kit";

export default function Home() {
  const { isClient } = usePreventServerSideRendering();
  useEffect(() => {
    injectNomoCSSVariables();
  }, []);

  if (!isClient) {
    return <div />;
  }
  return (
    <div style={mintingMainFlexBox}>
      <StakingTitleBar />
      <ChainSelectButton
        onClick={() => {
          location.replace("/minting");
        }}
        text={"ZEN20 (ZENIQ Smartchain)"}
      />
      <ChainSelectButton
        onClick={() => {
          location.replace("/minting");
        }}
        text={"ERC20 (Ethereum)"}
      />
      <ThemeSwitchButton />
    </div>
  );
}

export const ThemeSwitchButton: React.FC<{}> = () => {
  return (
    <button
      onClick={themeSwitchRotation}
      className="secondary-button"
      style={{
        backgroundColor: "var(--nomoPrimary)",
        padding: "8px",
        width: "auto",
        color: "var(--nomoOnPrimary)",
      }}
    >
      Switch Theme
    </button>
  );
};

async function themeSwitchRotation() {
  const oldTheme: NomoTheme = (await getCurrentNomoTheme()).name as NomoTheme;
  const newTheme: NomoTheme =
    oldTheme === "LIGHT"
      ? "DARK"
      : oldTheme == "DARK"
      ? "TUPAN"
      : oldTheme == "TUPAN"
      ? "AVINOC"
      : "LIGHT";
  await switchNomoTheme({ theme: newTheme });
  await injectNomoCSSVariables(); // refresh css variables after switching theme
}

export const ChainSelectButton: React.FC<{
  onClick: () => void;
  text: string;
}> = (props) => {
  return (
    <button
      disabled={false}
      className="primary-button"
      type="button"
      onClick={() => props.onClick()}
      style={{
        backgroundColor: "var(--nomoPrimary)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          columnGap: "8px",
          alignItems: "center",
          fontSize: "medium",
        }}
      >
        <img src={stakingIcon} alt={""} height={"16px"} />
        {props.text}
      </div>
    </button>
  );
};
