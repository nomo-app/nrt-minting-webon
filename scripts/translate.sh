#!/bin/bash
set -e

REPO_ROOT=$(git rev-parse --show-toplevel)
SERVICE_ACCOUNT_KEY="$REPO_ROOT/scripts/gcloud_service_account.json"
attranslate="$REPO_ROOT/node_modules/.bin/attranslate"

TRANSLATE_COMMON=( "--srcLng=en" "--service=google-translate" "--serviceConfig=$SERVICE_ACCOUNT_KEY" )
BASE_DIR="$REPO_ROOT/public/locales"
REACT_COMMON=( "${TRANSLATE_COMMON[@]}" "--srcFile=$BASE_DIR/en/translation.json" "--srcFormat=nested-json" "--targetFormat=nested-json" )

$attranslate "${REACT_COMMON[@]}" --targetFile="$BASE_DIR/da/translation.json" --targetLng="da"
$attranslate "${REACT_COMMON[@]}" --targetFile="$BASE_DIR/de/translation.json" --targetLng="de"
$attranslate "${REACT_COMMON[@]}" --targetFile="$BASE_DIR/es/translation.json" --targetLng="es"
$attranslate "${REACT_COMMON[@]}" --targetFile="$BASE_DIR/fr/translation.json" --targetLng="fr"
$attranslate "${REACT_COMMON[@]}" --targetFile="$BASE_DIR/it/translation.json" --targetLng="it"
$attranslate "${REACT_COMMON[@]}" --targetFile="$BASE_DIR/ja/translation.json" --targetLng="ja"
$attranslate "${REACT_COMMON[@]}" --targetFile="$BASE_DIR/ko/translation.json" --targetLng="ko"
$attranslate "${REACT_COMMON[@]}" --targetFile="$BASE_DIR/nl/translation.json" --targetLng="nl"
$attranslate "${REACT_COMMON[@]}" --targetFile="$BASE_DIR/pt/translation.json" --targetLng="PT"
$attranslate "${REACT_COMMON[@]}" --targetFile="$BASE_DIR/ru/translation.json" --targetLng="ru"
$attranslate "${REACT_COMMON[@]}" --targetFile="$BASE_DIR/sv/translation.json" --targetLng="SV"
$attranslate "${REACT_COMMON[@]}" --targetFile="$BASE_DIR/zh/translation.json" --targetLng="zh"
