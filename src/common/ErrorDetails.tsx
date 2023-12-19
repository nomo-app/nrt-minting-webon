import React from "react";

type ErrorDetailsProps = {
  error: Error;
};

/**
 * This component acts as a replacement for a Sentry-styled error reporting.
 * By dumping detailled errors onto screenshots, we can save money and time for operations.
 */
const ErrorDetails: React.FC<ErrorDetailsProps> = (props) => {
  const error = props.error;
  let errorString: string;
  try {
    errorString = JSON.stringify(error);
  } catch (e) {
    errorString = error?.message || error.toString();
  }
  return (
    <div
      style={{
        width: "100%",
        color: "red",
        fontSize: "small",
        overflowWrap: "anywhere",
      }}
    >
      {errorString}
    </div>
  );
};

export default ErrorDetails;
