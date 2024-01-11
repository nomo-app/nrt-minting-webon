import "@/util/i18n";
import { avinocIcon } from "@/asset-paths";
import { navigateToMintingPage } from "@/web3/navigation";
import { nomo } from "nomo-webon-kit";
import { useNavigate } from "react-router-dom";
import "./minting/ui/MintingPage.css";
import "./WelcomePage.scss";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="content">
      <div className="header">
        <img src={avinocIcon} className="avinoc-icon" />
        <h1>AVINOC Staking</h1>
      </div>
      <div className="body">
        <div className="card">
          <button className="chainselect-button" onClick={() => {navigateToMintingPage("zeniq-smart-chain", navigate)}}>ZEN20 (ZENIQ Smartchain)</button>
          <button className="chainselect-button" onClick={() => {navigateToMintingPage("ethereum", navigate)}}>ERC20 (Ethereum)</button>
        </div>
      </div>
      <div className="footer">
        <div className="container">
          <button className="migrate-button" onClick={installMigrationWebOn}>Perform Migration</button>
        </div>
        <div className="migration-info">
          Migrate from ERC20 to ZEN20
        </div>
      </div>
    </div>
  );
}

async function installMigrationWebOn() {
  nomo.installWebOn({
    deeplink: "https://nomo.app/webon/avinoc-migration.nomo.app",
    navigateBack: false,
    skipPermissionDialog: true,
  });
}
