// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

// import readline from 'node:readline'
import process from 'process'

let promptBuf = ''

/**
 *
 * @param query
 */
export async function prompt(query: string) {
	process.stderr.write(query)

	const inputs = promptBuf.split(/\r?\n/)
	if (inputs.length > 1) {
		const data = inputs.shift() as string
		promptBuf = inputs.join('\n')
		return data
	}

	let data = promptBuf
	for await (const chunk of process.stdin) {
		const inputs = ('' + chunk).split(/\r?\n/)
		if (inputs.length > 1) {
			data += inputs.shift() as string
			promptBuf = inputs.join('\n')
			break
		}
		data += chunk
	}

	// process all the data and write it back to stdout

	return data.replace(/\r?\n$/, '')
}
