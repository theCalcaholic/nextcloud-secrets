// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

import console from 'node:console'
import { InvalidArgumentError, program } from 'commander'
import {createSecret, retrieveSecret, showApiInfo} from './secrets.ts'
import { CommandExecutionError } from './CommandExecutionError.ts'

program
	.name('nc-secrets')
	.description('cli for https://apps.nextcloud.com/apps/secrets')
	.option('-k, --insecure', 'Disable SSL certificate validation (FOR TESTING ONLY)')
program.command('create')
	.description('Create a new secret')
	.argument('<nextcloud-url>', 'URL of your Nextcloud server')
	.argument('<user>', 'Your nextcloud user')
	.argument('<secret-file>', 'path to a file containing your secret', undefined)
	.option('-P, --pass-file <pass-file>',
		'Read nextcloud password from file at given path (default: stdin)',
		undefined)
	.option('-E, --expire <days>',
		'Expire secret in given number of days',
		(days) => (days === undefined) ? 7 : parseInt(days))
	.option('-p, --protect <password>',
		'Protect the secret share with the given password',
		undefined)
	.option('-t, --title <title>', 'Title of the secret')
	.action(createSecret)
program.command('retrieve')
	.description('Retrieve a secret and print it to stdout')
	.argument('<secret-url>', 'URL of the secret to be retrieved (either the secret share or ocs URL)')
	.option('-d, --key <decryption-key>', 'Secret decryption key (only required if not part of <secret-url>)')
	.option('-p, --password <password>', 'password in case the secret is password protected')
	.action(retrieveSecret)
program.command('info')
	.description('Get information about a Nextcloud Secrets API')
	.argument('<secrets-url>', 'Address of the secrets API')
	.action(showApiInfo)

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

// const args = process.argv
// const USAGE = `nc-secrets [COMMAND] [OPTIONS] [FILE]
//
//   COMMAND
//     create nexcloud-url user [FILE]  Create a new secret from FILE or stdin
// 	  OPTIONS
// 		-h, --help                   Show this message
// 		-P, --pass-file=path         Read password from file at given path (default: stdin)
// 		-E, --expire=days            Expire secret in given number of days
// 		-p, --protect=password       Protect the secret with the given password
//
//     retrieve secret-url              Retrieve a secret from it's share page url or OCS-API url`
//
// if (args.indexOf('--help') !== -1 || args.indexOf('-h') !== -1) {
// 	console.log(USAGE)
// 	console.log(program.usage())
// 	process.exit(0)
// }
//
// try {
// 	switch (args[2]) {
// 	case 'create':
// 		await createSecret(args.filter((arg) => !(arg.endsWith('/bun') || arg.endsWith('/cli.ts'))).slice(1))
// 		break
// 	case 'retrieve':
// 		await retrieveSecret(args.filter((arg) => !(arg.endsWith('/bun') || arg.endsWith('/cli.ts'))).slice(1))
// 		break
// 	default: {
// 		const btoaBuf = (str: string) => Buffer.from(str, 'binary').toString('base64')
// 		const atobBuf = (str: string) => Buffer.from(str, 'base64').toString('binary')
//
// 		console.log(args[2])
// 		console.log(btoaBuf(args[2]))
// 		// console.log(btoa(args[2]))
// 		console.error(`Invalid command: '${args[2]}'`)
// 		process.exit(1)
// 	}
// 	}
// } catch (e: unknown) {
// 	if (e instanceof CommandExecutionError) {
// 		console.error((e as CommandExecutionError).message)
// 	} else if (e instanceof InvalidArgumentError) {
// 		console.error(`${e}\n\n${program.usage()}`)
// 	} else {
// 		throw e
// 	}
// }

// console.log(await cryptolib.decrypt(payload, privKey, iv))

process.exit(0)
