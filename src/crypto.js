// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later


const ALGO = "AES-GCM"

export default class CryptoLib {

	/**
	 * @param theCrypto {Crypto}
	 */
	constructor(theCrypto) {
		this.crypto = theCrypto;
		this.algorithm = ALGO
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
			{ name: this.algorithm, iv: iv },
			key,
			new TextEncoder().encode(plain)
		);

		return this.arrayBufferToB64String(new Uint8Array(cipherBuffer))
	}
	async sha256Digest(str) {
		console.debug("md5Digest(...)")
		let textBuffer = new TextEncoder().encode(str);
		const hashBuffer = await this.crypto.subtle.digest('SHA-256', textBuffer);
		return this.arrayBufferToB64String(new Uint8Array(hashBuffer));
	}
	/**
	 *
	 * @param str
	 * @returns {Uint8Array}
	 */
	b64StringToArrayBuffer(str) {
		console.debug("b64StringToArrayBuffer(...)");
		return new Uint8Array(Array.from(window.atob(str)).map(ch => ch.charCodeAt(0)))
		//return new Uint8Array(Array.from(window.atob(str)).map(ch => ch.charCodeAt(0)))
	}
	/**
	 *
	 * @param buf {Uint8Array}
	 * @returns {string}
	 */
	arrayBufferToB64String(buf) {
		console.debug("arrayBufferToB64String(...)")
		//return window.btoa(buf)
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
			{ name: this.algorithm, iv: iv },
			key,
			this.b64StringToArrayBuffer(cipher)
		);
		return new TextDecoder().decode(plainBuffer);
	}

	/**
	 * generates random IV
	 * @returns {Promise<Uint8Array>}
	 */
	async generateIv() {
		return window.crypto.getRandomValues(new Uint8Array(12))
	}

	/**
	 * generates random crypto key for AES encryption
	 * @returns {Promise<CryptoKey>}
	 */
	async generateCryptoKey() {
		console.debug("generateCryptoKey()")
		console.debug(this.crypto.subtle.generateKey)
		return await this.crypto.subtle.generateKey({
				name: this.algorithm,
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
			this.b64StringToArrayBuffer(hexKey),
			{name: this.algorithm, iv: iv},
			false,
			['decrypt']
		);
	}
}
