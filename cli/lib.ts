// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

import readline from 'node:readline'
import process from 'process'

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

export async function prompt(query: string){

	process.stderr.write(query)

	let data = ""
	for await (const chunk of process.stdin) {
		data += chunk;
	}


	// process all the data and write it back to stdout

	return data.replace(/\n$/, "")
}
