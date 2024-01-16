import React from "react";
import { Route, Routes } from "react-router-dom";
import MintingPage from "./app/minting/logic/MintingPage";
import "./app/globals.css";
import ClaimRewardsPage from "./app/claiming/logic/ClaimRewardsPage";
import { HashRouter } from "react-router-dom";

const App: React.FC = () => {
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
