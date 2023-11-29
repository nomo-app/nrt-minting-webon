"use client";

import i18n, { LanguageDetectorAsyncModule } from "i18next";
import Backend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";
import { nomo } from "nomo-webon-kit";

const Languages = [
  "en",
  "de",
  "fr",
  "es",
  "da",
  "it",
  "ja",
  "ko",
  "nl",
  "pt",
  "ru",
  "sv",
  "zh",
];

const languageDetector: LanguageDetectorAsyncModule = {
  type: "languageDetector",
  async: true,
  detect: (callback: (languageCode: string) => void) => {
    return nomo.getLanguage().then((r) => {
      callback(r.language);
    });
  },
  init: () => {
    return;
  },
  cacheUserLanguage: () => {
    return;
  },
};

const throwOnMissingTranslation = false; //= process.env.NODE_ENV === "development";

i18n
  // load translation using http -> see /public/locales (i.e. https://github.com/i18next/react-i18next/tree/master/example/react/public/locales)
  // learn more: https://github.com/i18next/i18next-http-backend
  .use(Backend)
  // Use custom language detector
  .use(languageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    fallbackLng: "en",
    load: "languageOnly",
    debug: process.env.NODE_ENV === "development",
    whitelist: Languages,
    ns: ["translation"],
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    saveMissing: true,
    missingKeyHandler: (lngs, ns, key, fallbackValue) => {
      if (throwOnMissingTranslation) {
        throw Error(`Missing translation ${key}`);
      } else {
        //console.error(`Missing translation ${key}`);
      }
    },
  });
