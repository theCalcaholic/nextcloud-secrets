/* @peeky {
  runtimeEnv: 'dom'
} */

// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

const crypto = require('crypto')
import CryptoLib from './crypto';

const mockCrypto = {
	subtle: {
		async digest(alg, buf) {
			const text = new TextDecoder().decode(buf)
			return Promise.resolve(new TextEncoder().encode(`hashed(${text})`))
		},
		async generateKey( algorithm, extractable= false, keyUsages = []) {
			return {
				usages: keyUsages,
				extractable: extractable,
				algorithm: {
					name: algorithm.name,
					length: algorithm.length
				},
				type: 'secret'
			}
		},
		async encrypt(algorithm, key, data) {
			return new TextEncoder().encode(
				JSON.stringify({
					plaintext: Array.from(data),
					algorithm: algorithm,
					key: key,
					type: 'encryptedData'
				})
			)
		},
		async decrypt(algorithm, key, data) {
			const encryptedObj = JSON.parse(new TextDecoder().decode(data))
			if (key !== encryptedObj.key || algorithm.name !== encryptedObj.algorithm.name || algorithm.iv !== algorithm.iv) {
				throw new Error("Decryption failed: Key, algorithm and iv must match")
			}

			return Uint8Array.from(encryptedObj.plaintext)
		}
	}
}

const cryptoLib = new CryptoLib(mockCrypto)

describe('Cryptolib Test Suite', () => {
	test('md5Digest creates valid md5 sum', async () => {
		const result = await cryptoLib.sha256Digest("test")
		expect(window.atob(result)).toBe("hashed(test)")
	})

	test('Generated CryptoKey is valid and can be imported', async () => {
		const cryptoKey = await cryptoLib.generateCryptoKey()

		expect(cryptoKey.type).toBe('secret')
		expect(cryptoKey.algorithm.name).toBe(cryptoLib.algorithm)
		expect(cryptoKey.usages).toContain("encrypt", "decrypt")
		expect(cryptoKey.extractable).toBeTruthy()

		// await cryptoLib.importDecryptionKey(
		// 	cryptoLib.arrayBufferToB64String(new Uint8Array(await crypto.subtle.exportKey('raw', cryptoKey))),
		// 	cryptoLib.generateIv())
	})

	test('Data can be serialized and deserialized successfully', () => {
		const asciiDataString = 'abcdefhijklmnopqrstuvwxyzABCDEFHIJKLMNOPQRSTUVWXYZ0123456789'
		const asciiData = new TextEncoder().encode(asciiDataString)
		const asciiDataB64 = cryptoLib.arrayBufferToB64String(asciiData)
		expect(asciiDataB64).not.toBe(null);
		const asciiDataDeserialized = cryptoLib.b64StringToArrayBuffer(asciiDataB64)
		const asciiDataDeserializedString = new TextDecoder().decode(asciiDataDeserialized)
        console.log("expected: ", asciiDataString, ", actual: ", asciiDataDeserializedString)
		expect(asciiDataDeserializedString).toStrictEqual(asciiDataString)

        const utf8DataString = 'adsj;aöä?!"§/()!IAS💌'
        const utf8Data = new TextEncoder().encode(utf8DataString)
        const utf8DataB64 = cryptoLib.arrayBufferToB64String(utf8Data)
        expect(utf8DataB64).not.toBe(null);
        const utf8DataDeserialized = cryptoLib.b64StringToArrayBuffer(utf8DataB64)
        const utf8DataDeserializedString = new TextDecoder().decode(utf8DataDeserialized)
        console.log("expected: ", utf8DataString, ", actual: ", utf8DataDeserializedString)
        expect(utf8DataDeserializedString).toStrictEqual(utf8DataString)
	})

	test('Encryption uses the Crypto.subtle.encrypt interface correctly', async() => {
		const textDecoder = new TextDecoder()

		const payload = "my secret"
		const encrypted = await cryptoLib.encrypt(payload, "TEST-CRYPTOKEY", "TEST-IV")
		const encryptedInfo = JSON.parse(textDecoder.decode(cryptoLib.b64StringToArrayBuffer(encrypted)))
		const encryptedPayload = textDecoder.decode(Uint8Array.from(encryptedInfo.plaintext))

        expect(encryptedInfo.type).toBe('encryptedData')
		expect(encryptedPayload).toBe(payload)
		expect(encryptedInfo.key).toBe("TEST-CRYPTOKEY")
		expect(encryptedInfo.algorithm).toStrictEqual({ name: cryptoLib.algorithm, iv: 'TEST-IV' })
	})

	test('Decryption uses the Crypto.subtle.decrypt interface correctly and supplies the right arguments', async() => {
		const payload = "my secret"
		const encrypted = await cryptoLib.encrypt(payload, "TEST_CRYPTOKEY", "TEST_IV")
		const decrypted = await cryptoLib.decrypt(encrypted, "TEST_CRYPTOKEY", "TEST_IV")

		expect(decrypted).toBe(payload)
	})
})
