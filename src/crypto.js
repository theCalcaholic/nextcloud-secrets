// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later


const ALGO = 'AES-GCM'

export default class CryptoLib {

	debug = false

	/**
	 * @param {Crypto} theCrypto Crypto library (e.g. window.crypto)
	 * @param {{btoa: Function, atob: Function}} hashApi Hash api functions (e.g. window)
	 * @param {boolean} debug Enables debug mode
	 */
	constructor(theCrypto, hashApi, debug) {
		this.crypto = theCrypto
		this.hashApi = hashApi
		this.algorithm = ALGO
		this.debug = !!debug
	}

	/**
	 *
	 * @param {string} plain plain
	 * @param {CryptoKey} key key
	 * @param {Uint8Array} iv iv
	 * @return {Promise<string>}
	 */
	async encrypt(plain, key, iv) {
		if(this.debug)
			console.debug("encryptString(...)");
		const cipherBuffer = await this.crypto.subtle.encrypt(
			{ name: this.algorithm, iv: iv },
			key,
			new TextEncoder().encode(plain)
		)

		return this.arrayBufferToB64String(new Uint8Array(cipherBuffer))
	}
	async sha256Digest(str) {
		if(this.debug)
			console.debug("md5Digest(...)")
		let textBuffer = new TextEncoder().encode(str)
		const hashBuffer = await this.crypto.subtle.digest('SHA-256', textBuffer)
		return this.arrayBufferToB64String(new Uint8Array(hashBuffer))
	}
	/**
	 *
	 * @param {string} str str
	 * @return {Uint8Array}
	 */
	b64StringToArrayBuffer(str) {
		if(this.debug)
			console.debug("b64StringToArrayBuffer(...)")
		return new Uint8Array(Array.from(this.hashApi.atob(str)).map(ch => ch.charCodeAt(0)))
	}
	/**
	 *
	 * @param {Uint8Array} buf buf
	 * @returns {string}
	 */
	arrayBufferToB64String(buf) {
		if(this.debug)
			console.debug("arrayBufferToB64String(...)")
		return this.hashApi.btoa(Array.from(buf).map(byte => String.fromCharCode(byte)).join(''))
	}
	/**
	 *
	 * @param {string} cipher Cipher
	 * @param {CryptoKey} key Key
	 * @param {Uint8Array} iv Iv
	 * @return {Promise<string>}
	 */
	async decrypt(cipher, key, iv) {
		const plainBuffer = await this.crypto.subtle.decrypt(
			{ name: this.algorithm, iv },
			key,
			this.b64StringToArrayBuffer(cipher)
		)
		return new TextDecoder().decode(plainBuffer)
	}

	/**
	 * generates random IV
	 *
	 * @return {Uint8Array}
	 */
	generateIv() {
		return this.crypto.getRandomValues(new Uint8Array(12))
	}

	/**
	 * generates random crypto key for AES encryption
	 *
	 * @return {Promise<CryptoKey>}
	 */
	async generateCryptoKey() {
		if(this.debug) {
			console.debug("generateCryptoKey()")
		}
		return await this.crypto.subtle.generateKey({
				name: this.algorithm,
				length: 256,
			},
			true,
			["encrypt", "decrypt"])
	}
	/**
	 *
	 * @param {string} hexKey hexKey
	 * @param {Uint8Array} iv Iv
	 * @return {Promise<CryptoKey>}
	 */
	async importDecryptionKey(hexKey, iv) {
		if(this.debug)
			console.debug("importDecryptionKey(...)")
		const keyBuf = this.b64StringToArrayBuffer(hexKey)
		if(this.debug) {
			console.debug("import key...")
		}
		return await this.crypto.subtle.importKey(
			'raw',
			keyBuf,
			{ name: this.algorithm, iv },
			false,
			['decrypt']
		)
	}

}
