import "@/util/i18n"; // needed to initialize i18next
import {
  themeSwitchRotation,
  useNomoTheme,
} from "@/util/util";
import { avinocIcon, stakingIcon } from "@/asset-paths";
import { mintingMainFlexBox } from "./minting/ui/minting-style";
import { navigateToMintingPage } from "@/web3/navigation";
import { nomo } from "nomo-webon-kit";
import { useNavigate } from "react-router-dom";
import "./minting/ui/MintingPage.css";

export default function Home() {
  useNomoTheme();

  const navigate = useNavigate();
  return (
    <div style={mintingMainFlexBox}>
      <WelcomeTitleBar />
      <ChainSelectButton
        onClick={() => {
          navigateToMintingPage("zeniq-smart-chain", navigate);
        }}
        text={"ZEN20 (ZENIQ Smartchain)"}
      />
      <ChainSelectButton
        onClick={() => {
          navigateToMintingPage("ethereum", navigate);
        }}
        text={"ERC20 (Ethereum)"}
      />
      <MigrateToZEN20Button />
      <div style={{ height: "16px" }} />
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

async function installMigrationWebOn() {
  nomo.installWebOn({
    deeplink: "https://nomo.app/webon/avinoc-migration.nomo.app",
    navigateBack: false,
    skipPermissionDialog: true,
  });
}

export const MigrateToZEN20Button: React.FC<{}> = () => {
  return (
    <button
      onClick={installMigrationWebOn}
      className="primary-button"
      style={{
        backgroundColor: "var(--nomoPrimary)",
        padding: "8px",
        color: "var(--nomoOnPrimary)",
      }}
    >
      Migrate from ERC20 to ZEN20
    </button>
  );
};

const ChainSelectButton: React.FC<{
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

const WelcomeTitleBar: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        alignContent: "space-around",
        width: "100%",
        justifyContent: "center",
        marginTop: "20px",
      }}
    >
      <div style={{ flexGrow: 11 }} />
      <img
        src={avinocIcon}
        className="Avinoc-Hex"
        alt="hex"
        style={{
          width: "10%",
        }}
      />
      <div style={{ flexGrow: 1 }} />
      <div style={{ fontWeight: "bold", fontSize: "large" }}>
        {"AVINOC DeFi"}
      </div>
      <div style={{ flexGrow: 15 }} />
    </div>
  );
};
