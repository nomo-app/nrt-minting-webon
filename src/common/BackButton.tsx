import React from "react";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { handleGoBack } from "@/web3/navigation";

const BackButton: React.FC = () => {
  return (
    <Button
      style={{ color: "var(--nomoOnPrimary)" }}
      variant="outlined"
      startIcon={<ArrowBackIcon />}
      onClick={handleGoBack}
    />
  );
};

export default BackButton;
