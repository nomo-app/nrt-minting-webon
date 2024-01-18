import React, { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import MintingPage from "./app/minting/logic/MintingPage";
import "./app/globals.css";
import ClaimRewardsPage from "./app/claiming/logic/ClaimRewardsPage";
import { HashRouter } from "react-router-dom";
import { nomo } from "nomo-webon-kit";

const App: React.FC = () => {
  useEffect(() => {
    nomo.registerOnWebOnVisible((_args: { cardMode: boolean }) => {
      nomo.checkForWebOnUpdate();
    });
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MintingPage />} />
        <Route path="/claiming" element={<ClaimRewardsPage />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
