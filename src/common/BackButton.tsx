import React from "react";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { handleGoBack } from "@/web3/navigation";

const BackButton: React.FC = () => {
  return (
    <Button
      sx={{
        '&:hover': {
          backgroundColor: '#5432fd', // Slightly darker for the hover state
        },
      }}
      startIcon={<ArrowBackIcon style={{fill: 'white', width: '2rem', height: '2rem'}} />}
      onClick={handleGoBack}
    />
  );
};

export default BackButton;
