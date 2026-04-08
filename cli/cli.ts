// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { StringSource } from '@/model'

import { InvalidArgumentError, program } from 'commander'
import console from 'node:console'
import { CommandExecutionError } from './CommandExecutionError.ts'
import { createSecret, retrieveSecret, showApiInfo } from './secrets.ts'
import { StringSourceFile, StringSourcePrompt } from '@/model'

program
	.name('nc-secrets')
	.description('cli for https://apps.nextcloud.com/apps/secrets')
	.option('-k, --insecure', 'Disable SSL certificate validation (FOR TESTING ONLY)')
program.command('create')
	.description('Create a new secret')
	.argument('<nextcloud-url>', 'URL of your Nextcloud server')
	.argument('<user>', 'Your nextcloud user')
	.argument('<secret-file>', 'path to a file containing your secret', undefined)
	.option('-P, --pass-file <pass-file>', 'Read nextcloud password from file at given path (default: stdin)', undefined)
	.option('-E, --expire <days>', 'Expire secret in given number of days', (days) => (days === undefined) ? 7 : parseInt(days))
	.option('-p, --protect <password>', 'Protect the secret share with the given password', undefined)
	.option('-t, --title <title>', 'Title of the secret')
	.action(async (ncUrl, ncUser, secretFile, options) => {
		let secretSource: StringSource
		let passSource: StringSource
		if (secretFile) {
			secretSource = new StringSourceFile(secretFile)
		} else {
			secretSource = new StringSourcePrompt('Enter secret to encrypt:')
		}
		if (options.passFile) {
			passSource = new StringSourceFile(options.passFile)
		} else {
			passSource = new StringSourcePrompt('Enter Nextcloud passwort/token:')
		}
		console.log(JSON.stringify(await createSecret(ncUrl, ncUser, passSource, secretSource, options), null, 2))
	})
program.command('retrieve')
	.description('Retrieve a secret and print it to stdout')
	.argument('<secret-url>', 'URL of the secret to be retrieved (either the secret share or ocs URL)')
	.option('-d, --key <decryption-key>', 'Secret decryption key (only required if not part of <secret-url>)')
	.option('-p, --password <password>', 'password in case the secret is password protected')
	.action(async (shareUrlStr, options) => {
		console.log(await retrieveSecret(shareUrlStr, options))
	})
program.command('info')
	.description('Get information about a Nextcloud Secrets API')
	.argument('<nextcloud-url>', 'Address of the secrets API')
	.action(async (ncUrl, options) => {
		console.log(await showApiInfo(ncUrl, options))
	})

try {
	await program.parseAsync()
} catch (e: unknown) {
	if (e instanceof CommandExecutionError) {
		console.error((e as CommandExecutionError).message)
		process.exit(1)
	} else if (e instanceof InvalidArgumentError) {
		console.error(`${e}\n\n${program.usage()}`)
		process.exit(2)
	} else {
		throw e
	}
}

process.exit(0)
