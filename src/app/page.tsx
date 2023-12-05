"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    location.replace("/minting");
  }, []);
  return <div></div>;
}
