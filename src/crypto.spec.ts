/* @peeky {
  runtimeEnv: 'dom'
} */

// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

import CryptoLib from './crypto.js'

type MockAlgorithmSpec = AesKeyGenParams | HmacKeyGenParams | Pbkdf2Params

const mockCrypto = {
	subtle: {
		async digest(alg: AlgorithmIdentifier, buf: BufferSource) {
			const text = new TextDecoder().decode(buf)
			return Promise.resolve(new TextEncoder().encode(`hashed(${text})`))
		},
		async generateKey(algorithm: MockAlgorithmSpec, extractable = false, keyUsages: KeyUsage[] = []) {
			return {
				usages: keyUsages,
				extractable,
				algorithm,
				type: 'secret' as KeyType,
			}
		},
		async encrypt(algorithm: MockAlgorithmSpec, key: CryptoKey, data: BufferSource) {
			return new TextEncoder().encode(JSON.stringify({
				plaintext: Array.from(data as Uint8Array),
				algorithm,
				key,
				type: 'encryptedData',
			}))
		},
		async decrypt(algorithm: MockAlgorithmSpec, key: CryptoKey, ciphertext: BufferSource) {
			const encryptedObj = JSON.parse(new TextDecoder().decode(ciphertext))
			let k: string
			let v: unknown
			for ([k, v] of Object.entries(encryptedObj.key)) {
				// Using JSON.stringify as workaround to allow for deep object comparisons
				// @ts-ignore: TypeScript doesn't like arbitrary property access
				if (key[k] !== v && JSON.stringify(key[k]) !== JSON.stringify(v)) {
					// @ts-ignore: TypeScript doesn't like arbitrary property access
					throw new Error(`decryption key doesn't match encryption key property '${k}': expected '${v}', got '${key[k]}'`)
				}
			}
			if (algorithm.name !== encryptedObj.algorithm.name) {
				throw new Error('Decryption failed: Key, algorithm and iv must match\n')
			}

			return Uint8Array.from(encryptedObj.plaintext)
		},
	},
	getRandomValues(buf: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
		for (let i = 0; i < buf.length; i++) {
			buf[i] = 0
		}
		return buf
	},
}

const mockHash = {
	btoa,
	atob,
}

const cryptoLib = new CryptoLib(mockCrypto as never, mockHash, true)

describe('Cryptolib Test Suite', () => {
	test('md5Digest creates valid md5 sum', async () => {
		const result = await cryptoLib.sha256Digest('test')
		expect(window.atob(result)).toBe('hashed(test)')
	})

	test('Generated CryptoKey is valid and can be imported', async () => {
		const cryptoKey = await cryptoLib.generateCryptoKey()

		expect(cryptoKey.type).toBe('secret')
		// @ts-expect-error: Allow access to private field for testing
		const { algorithm } = cryptoLib
		expect(cryptoKey.algorithm.name).toBe(algorithm)
		expect(cryptoKey.usages).toContain('encrypt')
		expect(cryptoKey.usages).toContain('decrypt')
		expect(cryptoKey.extractable).toBeTruthy()

		// await cryptoLib.importDecryptionKey(
		// cryptoLib.arrayBufferToB64String(new Uint8Array(await crypto.subtle.exportKey('raw', cryptoKey))),
		// cryptoLib.generateIv())
	})

	test('Data can be serialized and deserialized successfully', () => {
		const asciiDataString = 'abcdefhijklmnopqrstuvwxyzABCDEFHIJKLMNOPQRSTUVWXYZ0123456789'
		const asciiData = new TextEncoder().encode(asciiDataString)
		const asciiDataB64 = cryptoLib.arrayBufferToB64String(asciiData)
		expect(asciiDataB64).not.toBe(null)
		const asciiDataDeserialized = cryptoLib.b64StringToArrayBuffer(asciiDataB64)
		const asciiDataDeserializedString = new TextDecoder().decode(asciiDataDeserialized)
		console.log('expected: ', asciiDataString, ', actual: ', asciiDataDeserializedString)
		expect(asciiDataDeserializedString).toStrictEqual(asciiDataString)

		const utf8DataString = 'adsj;aöä?!"§/()!IAS💌'
		const utf8Data = new TextEncoder().encode(utf8DataString)
		const utf8DataB64 = cryptoLib.arrayBufferToB64String(utf8Data)
		expect(utf8DataB64).not.toBe(null)
		const utf8DataDeserialized = cryptoLib.b64StringToArrayBuffer(utf8DataB64)
		const utf8DataDeserializedString = new TextDecoder().decode(utf8DataDeserialized)
		console.log('expected: ', utf8DataString, ', actual: ', utf8DataDeserializedString)
		expect(utf8DataDeserializedString).toStrictEqual(utf8DataString)
	})

	test('Encryption uses the Crypto.subtle.encrypt interface correctly', async () => {
		const textDecoder = new TextDecoder()

		const payload = 'my secret'
		// use string as key for usage with MockCrypto
		const key = 'TEST-CRYPTOKEY' as never
		// use string as iv for usage with MockCrypto
		const iv = 'TEST-IV' as never
		const encrypted = await cryptoLib.encrypt(payload, key, iv)
		const encryptedInfo = JSON.parse(textDecoder.decode(cryptoLib.b64StringToArrayBuffer(encrypted)))
		const encryptedPayload = textDecoder.decode(Uint8Array.from(encryptedInfo.plaintext))

		expect(encryptedInfo.type).toBe('encryptedData')
		expect(encryptedPayload).toBe(payload)
		expect(encryptedInfo.key).toBe('TEST-CRYPTOKEY')
		// @ts-expect-error: Allow access to private field for testing
		const { algorithm } = cryptoLib
		expect(encryptedInfo.algorithm).toStrictEqual({ name: algorithm, iv: 'TEST-IV' })
	})

	test('Decryption uses the Crypto.subtle.decrypt interface correctly and supplies the right arguments', async () => {
		const payload = 'my secret'
		const testKey = await mockCrypto.subtle.generateKey(
			{ name: 'TESTALGO', length: 256 },
			true,
			['encrypt', 'decrypt'],
		)
		const testIv = mockCrypto.getRandomValues(new Uint8Array(12))
		const encrypted = await cryptoLib.encrypt(payload, testKey, testIv)
		const decrypted = await cryptoLib.decrypt(encrypted, testKey, testIv)

		console.log('expected: ', decrypted, ', actual: ', payload)
		expect(decrypted).toBe(payload)
	})
})
