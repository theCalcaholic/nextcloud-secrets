// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later
export default {
	ALGO: 'AES-GCM',
	/**
	 *
	 * @param {string} plain
	 * @param {CryptoKey} key
	 * @param {Uint8Array} iv
	 * @return {Promise<string>}
	 */
	async encrypt(plain, key, iv) {
		const cipherBuffer = await window.crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv },
			key,
			new TextEncoder().encode(plain)
		)

		const cipherArray = Array.from(new Uint8Array(cipherBuffer))
		const cipherStr = cipherArray.map(byte => String.fromCharCode(byte)).join('')
		return window.btoa(cipherStr)
	},
	async md5Digest(str) {
		const textBuffer = new TextEncoder().encode(str)
		const hashBuffer = await crypto.subtle.digest('SHA-256', textBuffer)
		const hashArray = Array.from(new Uint8Array(hashBuffer))
		return window.btoa(hashArray.map(byte => String.fromCharCode(byte)).join(''))
	},
	/**
	 *
	 * @param {string} str
	 * @return {ArrayBuffer}
	 */
	stringToArrayBuffer(str) {
		const buff = new ArrayBuffer(str.length)
		const buffView = new Uint8Array(buff)
		for (let i = 0, strLen = str.length; i < strLen; i++) {
			buffView[i] = str.charCodeAt(i)
		}
		return buff
	},
	/**
	 *
	 * @param {ArrayBuffer} buf
	 * @return {string}
	 */
	arrayBufferToString(buf) {
		return String.fromCharCode.apply(null, buf)
	},
	/**
	 *
	 * @param {string} cipher
	 * @param {CryptoKey} key
	 * @param {Uint8Array} iv
	 * @return {Promise<string>}
	 */
	async decrypt(cipher, key, iv) {
		const plainBuffer = await window.crypto.subtle.decrypt(
			{ name: this.ALGO, iv },
			key,
			new Uint8Array(Array.from(window.atob(cipher)).map(ch => ch.charCodeAt(0)))
		)
		return new TextDecoder().decode(plainBuffer)
	},

	/**
	 *
	 * @return {Promise<CryptoKey>}
	 */
	async generateCryptoKey() {
		return await window.crypto.subtle.generateKey({
			name: 'AES-GCM',
			length: 256,
		},
		true,
		['encrypt', 'decrypt'])
	},
	/**
	 *
	 * @param {string} hexKey
	 * @param {Uint8Array} iv
	 * @return {Promise<CryptoKey>}
	 */
	async importDecryptionKey(hexKey, iv) {
		return await window.crypto.subtle.importKey(
			'raw',
			this.stringToArrayBuffer(window.atob(hexKey)),
			{ name: this.ALGO, iv },
			false,
			['decrypt']
		)
	},
}
