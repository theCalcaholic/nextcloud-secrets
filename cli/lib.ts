// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

//import readline from 'node:readline'
import process from 'process'

// readline breaks in noninteractive environments, so we're building our own prompt function
//
// const rl = readline.createInterface({
// 	input: process.stdin,
// 	output: process.stdout,
// 	terminal: false,
// })
// export const prompt = (query: string) => new Promise<string>((resolve) => {
// 	console.log("prompting...")
//
// 	if (!process.stdin.isTTY) {
// 		process.stdin._read()
// 	}
//
// 	return rl.question(query,
// 			(answer) => {
// 				rl.close()
// 				resolve(answer)
// 			})
// 	}
// )

let promptBuf = ""

export async function prompt(query: string){

	process.stderr.write(query)

	let inputs = promptBuf.split(/\r?\n/)
	if (inputs.length > 1) {
		let data = inputs.shift() as string;
		promptBuf = inputs.join("\n")
		return data
	}

	let data = promptBuf
	for await (const chunk of process.stdin) {
		let inputs = ("" + chunk).split(/\r?\n/)
		if (inputs.length > 1) {
			data += inputs.shift() as string
			promptBuf = inputs.join("\n")
			break;
		}
		data += chunk;
	}

	// process all the data and write it back to stdout

	return data.replace(/\r?\n$/, "")
}
