/* @peeky {
  runtimeEnv: 'dom'
} */

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
					lenght: algorithm.lenght
				},
				type: 'secret'
			}
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
})
