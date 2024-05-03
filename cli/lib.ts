import readline from 'node:readline'
import process from 'process'

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
})
export const prompt = (query: string) => new Promise<string>((resolve) => rl.question(query,
	(answer) => {
		rl.close()
		resolve(answer)
	})
)
