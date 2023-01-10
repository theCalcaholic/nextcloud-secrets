// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later


const ALGO = "AES-GCM"

export default class CryptoLib {

	/**
	 * @param crypto {Crypto}
	 */
	constructor(theCrypto) {
		this.crypto = theCrypto;
	}

	/**
	 *
	 * @param plain {String}
	 * @param key {CryptoKey}
	 * @param iv {Uint8Array}
	 * @returns {Promise<String>}
	 */
	async encrypt(plain, key, iv) {
		console.debug("encryptString(...)");
		const cipherBuffer = await this.crypto.subtle.encrypt(
			{ name: ALGO, iv: iv },
			key,
			new TextEncoder().encode(plain)
		);

		return this.arrayBufferToString(new Uint8Array(cipherBuffer))
	}
	async sha256Digest(str) {
		console.debug("md5Digest(...)")
		let textBuffer = new TextEncoder().encode(str);
		const hashBuffer = await this.crypto.subtle.digest('SHA-256', textBuffer);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return window.btoa(hashArray.map(byte => String.fromCharCode(byte)).join(''));
	}
	/**
	 *
	 * @param str
	 * @returns {Uint8Array}
	 */
	b64StringToArrayBuffer(str) {
		console.debug("stringToArrayBuffer(...)");

		return new Uint8Array(Array.from(window.atob(str)).map(ch => ch.charCodeAt(0)))
	}
	/**
	 *
	 * @param buf {Uint8Array}
	 * @returns {string}
	 */
	arrayBufferToString(buf) {
		console.debug("arrayBufferToString(...)")
		return window.btoa(Array.from(buf).map(byte => String.fromCharCode(byte)).join(''));
	}
	/**
	 *
	 * @param cipher {String}
	 * @param key {CryptoKey}
	 * @param iv {Uint8Array}
	 * @returns {Promise<String>}
	 */
	async decrypt(cipher, key, iv) {
		const plainBuffer = await this.crypto.subtle.decrypt(
			{ name: this.ALGO, iv: iv },
			key,
			this.stringToArrayBuffer(cipher)
		);
		return new TextDecoder().decode(plainBuffer);
	}

	/**
	 *
	 * @returns {Promise<CryptoKey>}
	 */
	async generateCryptoKey() {
		console.debug("generateCryptoKey()")
		return await this.crypto.subtle.generateKey({
				name: ALGO,
				length: 256
			},
			true,
			["encrypt", "decrypt"]);
	}
	/**
	 *
	 * @param hexKey {String}
	 * @param iv {Uint8Array}
	 * @returns {Promise<CryptoKey>}
	 */
	async importDecryptionKey(hexKey, iv) {
		console.debug("importDecryptionKey(...)")
		return await this.crypto.subtle.importKey(
			'raw',
			this.stringToArrayBuffer(hexKey),
			{name: this.ALGO, iv: iv},
			false,
			['decrypt']
		);
	}
}
