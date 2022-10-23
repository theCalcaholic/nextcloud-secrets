export default {
	async decrypt(cipher, key, iv) {
		const alg = { name: "AES-GCM", iv: this.stringToArrayBuffer(iv) }
		const decrypted = await window.crypto.subtle.decrypt(
			alg,
			await window.crypto.subtle.importKey(
				"raw",
				window.atob(key),
				"AES-GCM",
				false,
				['decrypt']
			),
			this.stringToArrayBuffer(cipher)
		);
		let decoder = new TextDecoder();
		return decoder.decode(decrypted)

	},
	encrypt(plain, key, iv) {

	}
	async decryptSecret(secret, key) {
		const iv = this.stringToArrayBuffer(secret.iv);
		const encrypted = this.stringToArrayBuffer(secret.encrypted);
		const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, encrypted);
		let decoder = new TextDecoder();
		console.log("decrypted:");
		console.log(decrypted);
		console.log(String.fromCharCode.apply(null, decrypted));
		console.log(decoder.decode(decrypted));

		return {
			uuid: secret.uuid,
			title: secret.title,
			iv: secret.iv,
			content: decoder.decode(decrypted),
			encrypted: secret.encrypted
		};
	},
}
