#!/usr/bin/env bash
# usage: fetch-asset.sh <url> <dest-path>
set -e
mkdir -p "$(dirname "$2")"
curl -sSL --fail -o "$2" "$1"
echo "$2 $(stat -c%s "$2") bytes"
