import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import WelcomePage from "./app/WelcomePage";
import MintingPage from "./app/minting/logic/MintingPage";
import "./app/globals.css";
import ClaimRewardsPage from "./app/claiming/logic/ClaimRewardsPage";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/minting" element={<MintingPage />} />
        <Route path="/claiming" element={<ClaimRewardsPage />} />
      </Routes>
    </Router>
  );
};

export default App;
