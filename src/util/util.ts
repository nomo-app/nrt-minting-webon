import {
  NomoTheme,
  getCurrentNomoTheme,
  injectNomoCSSVariables,
  switchNomoTheme,
} from "nomo-webon-kit";
import React, { useEffect, useState } from "react";

export async function themeSwitchRotation() {
  const oldTheme: NomoTheme = (await getCurrentNomoTheme()).name as NomoTheme;
  const newTheme: NomoTheme =
    oldTheme === "LIGHT"
      ? "DARK"
      : oldTheme == "DARK"
      ? "TUPAN"
      : oldTheme == "TUPAN"
      ? "AVINOC"
      : "LIGHT";
  await switchNomoTheme({ theme: newTheme });
  await injectNomoCSSVariables(); // refresh css variables after switching theme
}

function useNomoTheme() {
  useEffect(() => {
    injectNomoCSSVariables();
  }, []);
}

export function usePreventServerSideRendering() {
  const [isClient, setIsClient] = useState(false);
  useNomoTheme();
  useEffect(() => {
    setIsClient(true);
  }, []);
  return { isClient };
}

export function arrayBufferToBase64(buffer: any) {
  let binary = "";
  let bytes = new Uint8Array(buffer);
  let len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export const randomString = (length = 8) => {
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let str = "";
  for (let i = 0; i < length; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return str;
};

export async function fetchWithRetryEtherScan(args: {
  url: string;
}): Promise<Array<any> | string> {
  // first try without an api key
  const res1: Array<any> | string = (await (await fetch(args.url)).json())
    .result;
  if (Array.isArray(res1)) {
    return res1;
  }

  // retry with an api key
  const etherScanAPIKey = "AC72N833U9MKUNXS44MV27T3HKEN4WYYT3";
  return (await (await fetch(args.url + "&apikey=" + etherScanAPIKey)).json())
    .result;
}

export function formatFiat(num: number) {
  return num.toString();
}

export function formatCrypto(num: number) {
  return num.toString();
}

export function textShortener(text: string, length: number): string {
  return text.slice(0, length) + "..." + text.slice(text.length - length);
}

export function usePeriodReRender(intervalMillis: number) {
  const [tick, setTick] = React.useState<number>(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prevTick) => prevTick + 1);
    }, intervalMillis);
    return () => clearInterval(interval);
  }, []);
  return tick;
}
