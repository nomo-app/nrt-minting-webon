import React from "react";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { handleGoBack } from "@/web3/navigation";

const BackButton: React.FC = () => {
  return (
    <Button
      sx={{
        backgroundColor: '#2c04fe',
        '&:hover': {
          backgroundColor: '#5432fd', // Slightly darker for the hover state
        },
      }}
      startIcon={<ArrowBackIcon style={{fill: 'white'}} />}
      onClick={handleGoBack}
    />
  );
};

export default BackButton;
