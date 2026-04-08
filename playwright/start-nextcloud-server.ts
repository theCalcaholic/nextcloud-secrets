/**
 * SPDX-FileCopyrightText: 2024 Ferdinand Thiessen <opensource@fthiessen.de>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { startNextcloud, stopNextcloud } from '@nextcloud/e2e-test-server/docker'
import { readFileSync } from 'fs'
import path from 'node:path'
import { syncApp } from './util.ts'

/**
 *
 */
async function start() {
	const branch = getBranch()
	const cwd = process.cwd()
	const syncPath = path.join(cwd, 'build/test/secrets')
	await syncApp(cwd, syncPath, [path.join(cwd, 'build')])
	return await startNextcloud(branch, syncPath, {
		exposePort: 8089,
	})
}

/**
 *
 */
function getBranch() {
	try {
		const appinfo = readFileSync('appinfo/info.xml').toString()
		const maxVersion = appinfo.match(/<nextcloud\s*min-version="\d+"\s*max-version="(\d\d+)"\s*\/>/)?.[1]
		return maxVersion ? `stable${maxVersion}` : undefined
	} catch (err) {
		// @ts-expect-error error from upstream code
		if (err?.code === 'ENOENT') {
			console.warn('No appinfo/info.xml found. Using default server banch.')
		}
	}
}

// Start the Nextcloud docker container
await start()
// Listen for process to exit (tests done) and shut down the docker container
// eslint-disable-next-line @typescript-eslint/no-unused-vars
process.on('beforeExit', (code) => {
	stopNextcloud()
})

// Idle to wait for shutdown
while (true) {
	await new Promise((resolve) => setTimeout(resolve, 5000))
}
