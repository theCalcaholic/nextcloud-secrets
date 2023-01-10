/* @peeky {
  runtimeEnv: 'dom'
} */

import CryptoLib from './crypto';


describe('Cryptolib Test Suite', () => {
	test('md5Digest creates valid md5 sum', async () => {
		const crypto = {
			subtle: {
				async digest(alg, text) {
					return Promise.resolve(new Uint8Array(Array.from(`hashed(${text})`).map(ch => ch.charCodeAt(0))))
				}
			}
		}
		const cryptoLib = new CryptoLib(crypto);
		const result = await cryptoLib.sha256Digest("test")
		//const result = await crypto.subtle.digest("alg", "test")
		expect(result).toBe("hashed(test)")
	})
})
