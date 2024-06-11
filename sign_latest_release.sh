#!/usr/bin/env bash

# SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
# SPDX-License-Identifier: AGPL-3.0-or-later

set -e
tmp_dir="$(mktemp -d)"
trap 'rm -r "$tmp_dir"' EXIT
if [[ -z "$1" ]]
then
  RELEASE_DOWNLOAD_URL="https://github.com/theCalcaholic/nextcloud-secrets/releases/latest/download"
else
  RELEASE_DOWNLOAD_URL="https://github.com/theCalcaholic/nextcloud-secrets/releases/download/${1}"
fi
wget -q -O "$tmp_dir/secrets.tar.gz" "${RELEASE_DOWNLOAD_URL}"/secrets.tar.gz
wget -q -O "$tmp_dir/secrets.sha256" "${RELEASE_DOWNLOAD_URL}"/secrets.sha256
echo "Release SHA256 sum:"
cat "$tmp_dir/secrets.sha256"

checksum="$(cd "$tmp_dir"; sha256sum "secrets.tar.gz")"
[[ "$checksum" == "$(cat "$tmp_dir/secrets.sha256")" ]] || {
	echo "Checksum mismatch!" >&2
	echo "Expected: $(cat "$tmp_dir/secrets.sha256")"
	echo "Was:      $checksum"
	exit 1
}

openssl dgst -sha512 -sign "$HOME/.nextcloud/certificates/secrets.key" "$tmp_dir/secrets.tar.gz" | openssl base64


