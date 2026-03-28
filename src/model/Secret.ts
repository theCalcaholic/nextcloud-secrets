export interface Secret {
	uuid: ''
	title: string
	// date: Date,
	password?: string
	// null if existing (but undisclosed by the backend), undefined if not set
	pwHash: undefined | null
	key: CryptoKey | null
	iv: Uint8Array
	expires: Date
	_decrypted: string | null
	encrypted: string | null
}
