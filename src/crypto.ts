// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

const ALGO = 'AES-GCM'

interface HashApi {
	atob(data: string): string
	btoa(data: string): string
}

export default class CryptoLib {
	debug = false
	private crypto: Crypto
	private hashApi: HashApi
	public readonly algorithm: string

	constructor(theCrypto: Crypto, hashApi: HashApi, debug: boolean) {
		this.crypto = theCrypto
		this.hashApi = hashApi
		this.algorithm = ALGO
		this.debug = debug
	}

	// Encrypt the given string symmetrically
	async encrypt(plain: string, key: CryptoKey, iv: Uint8Array): Promise<string> {
		if (this.debug) { console.debug('encryptString(...)') }
		const cipherBuffer = await this.crypto.subtle.encrypt(
			{ name: this.algorithm, iv: this.uint8arrayToArrayBuffer(iv) },
			key,
			new TextEncoder().encode(plain),
		)

		return this.arrayBufferToB64String(new Uint8Array(cipherBuffer))
	}

	uint8arrayToArrayBuffer(inp: Uint8Array): ArrayBuffer {
		return inp.buffer.slice(inp.byteOffset, inp.byteOffset + inp.byteLength) as ArrayBuffer
	}

	// Generate sha256 hash for the given string
	async sha256Digest(str: string): Promise<string> {
		if (this.debug) { console.debug('md5Digest(...)') }
		const textBuffer = new TextEncoder().encode(str)
		const hashBuffer = await this.crypto.subtle.digest('SHA-256', textBuffer)
		return this.arrayBufferToB64String(new Uint8Array(hashBuffer))
	}

	// B64 encode a string to Uint8Array
	b64StringToArrayBuffer(str: string): Uint8Array {
		if (this.debug) { console.debug('b64StringToArrayBuffer(...)') }
		return new Uint8Array(Array.from(this.hashApi.atob(str))
			.map((ch) => ch.charCodeAt(0)))
	}

	// B64 Encode Uint8Array
	arrayBufferToB64String(buf: ArrayLike<number> | Iterable<number>): string {
		if (this.debug) { console.debug('arrayBufferToB64String(...)') }
		return this.hashApi.btoa(Array.from(buf).map((byte) => String.fromCharCode(byte)).join(''))
	}

	// Decrypt the given cipher string
	async decrypt(cipher: string, key: CryptoKey, iv: Uint8Array): Promise<string> {
		const plainBuffer = await this.crypto.subtle.decrypt(
			{ name: this.algorithm, iv: this.uint8arrayToArrayBuffer(iv) },
			key,
			this.uint8arrayToArrayBuffer(this.b64StringToArrayBuffer(cipher)),
		)
		return new TextDecoder().decode(plainBuffer)
	}

	// generates random IV
	generateIv(): Uint8Array {
		return this.crypto.getRandomValues(new Uint8Array(12))
	}

	// generates random crypto key for AES encryption
	async generateCryptoKey(): Promise<CryptoKey> {
		if (this.debug) {
			console.debug('generateCryptoKey()')
		}
		return await this.crypto.subtle.generateKey({
			name: this.algorithm,
			length: 256,
		}, true, ['encrypt', 'decrypt'])
	}

	// import decryption key from string
	async importDecryptionKey(hexKey: string): Promise<CryptoKey> {
		if (this.debug) { console.debug('importDecryptionKey(...)') }
		const keyBuf = this.b64StringToArrayBuffer(hexKey)
		if (this.debug) {
			console.debug('import key...')
		}
		return await this.crypto.subtle.importKey(
			'raw',
			this.uint8arrayToArrayBuffer(keyBuf),
			{ name: this.algorithm },
			false,
			['decrypt'],
		)
	}
}
