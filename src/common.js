// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later
export default {
	ALGO: "AES-GCM",
	/**
	 *
	 * @param plain {String}
	 * @param key {CryptoKey}
	 * @param iv {Uint8Array}
	 * @returns {Promise<String>}
	 */
	async encrypt(plain, key, iv) {
		console.log("encryptString( '", plain, "', '", key, "', '", iv, "' )");
		const cipherBuffer = await window.crypto.subtle.encrypt(
			{ name: "AES-GCM", iv: iv },
			key,
			new TextEncoder().encode(plain)
		);

		const cipherArray = Array.from(new Uint8Array(cipherBuffer));
		const cipherStr = cipherArray.map(byte => String.fromCharCode(byte)).join('');
		return window.btoa(cipherStr);
	},
	async md5Digest(str) {
		let textBuffer = new TextEncoder().encode(str);
		const hashBuffer = await crypto.subtle.digest('SHA-256', textBuffer);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return window.btoa(hashArray.map(byte => String.fromCharCode(byte)).join(''));
	},
	stringToArrayBuffer(str) {
		const buff = new ArrayBuffer(str.length)
		const buffView = new Uint8Array(buff)
		for(let i = 0, strLen = str.length; i < strLen; i++) {
			buffView[i] = str.charCodeAt(i);
		}
		return buff;
	},
	arrayBufferToString(buf) {
		return String.fromCharCode.apply(null, buf)
	},
	/**
	 *
	 * @param cipher {String}
	 * @param key {CryptoKey}
	 * @param iv {Uint8Array}
	 * @returns {Promise<String>}
	 */
	async decrypt(cipher, key, iv) {
		console.log("decrypt(", cipher, ",", key, ",", iv, ")");
		const plainBuffer = await window.crypto.subtle.decrypt(
			{ name: this.ALGO, iv: iv },
			key,
			new Uint8Array(Array.from(window.atob(cipher)).map(ch => ch.charCodeAt(0)))
		);
		return new TextDecoder().decode(plainBuffer);
	},
}
