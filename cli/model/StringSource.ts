export interface StringSource {
	read: () => Promise<string>
}
