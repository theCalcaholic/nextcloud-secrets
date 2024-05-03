import console from 'node:console'
import readline from 'node:readline'
import fs from 'fs'
import { Buffer } from 'node:buffer'
import { webcrypto } from 'node:crypto'
import http, { RequestOptions } from 'http'
import { generateOcsUrl, generateUrl } from '@nextcloud/router'
import { sha } from 'bun'
import CryptoLib from './crypto.import.js'
import { InvalidArgumentError } from 'commander'
import { CommandExecutionError } from './CommandExecutionError.ts'
import { prompt } from './lib.ts'
import process from "process";

const btoa = (str: string) => Buffer.from(str, 'binary').toString('base64')
const atob = (str: string) => Buffer.from(str, 'base64').toString('binary')

const cryptolib = new CryptoLib(webcrypto, { atob, btoa }, true)

/**
 * Parse global options
 *
 * @param options An object containing the global options
 */
function handleGlobalOptions(options: {insecure: boolean} & any) {
	if (options.insecure) {
		process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
	}
}
/**
 * Create a new secret
 *
 * @param ncUrl
 * @param ncUser
 * @param secretFile
 * @param options
 * @param options.passFile
 * @param options.days
 * @param options.password
 * @param options.title
 * @param options.insecure
 */
export async function createSecret(ncUrl: string, ncUser: string, secretFile: string | undefined, options: {
	passFile: string | undefined,
	days: number | undefined,
	protect: string | undefined,
	title: string | undefined,
	insecure: boolean | undefined
}) {
	console.log([ncUrl, ncUser, secretFile].join(', '))
	console.log(options)
	handleGlobalOptions(options)

	let ncPassword: string
	let plaintext: string

	if (options.passFile !== undefined) {
		ncPassword = fs.readFileSync(options.passFile, 'utf-8')
	} else {
		ncPassword = await prompt('Enter Nextcloud passwort/token:')
	}

	if (secretFile === undefined) {
		plaintext = await prompt('Enter secret to encrypt>')
	} else {
		plaintext = fs.readFileSync(secretFile, 'utf-8')
	}

	const privKey = await cryptolib.generateCryptoKey()
	const iv = await cryptolib.generateIv()
	const encrypted = await cryptolib.encrypt(plaintext, privKey, iv)

	const expiryDate = new Date()
	expiryDate.setDate((new Date()).getDate() + (options.days ?? 7))
	const postData = JSON.stringify({
		title: options.title ?? 'Generated with secrets-cli',
		password: options.protect,
		expires: expiryDate,
		encrypted,
		iv: cryptolib.arrayBufferToB64String(iv),
	})

	const rOptions: RequestOptions = {
		method: 'POST',
		auth: `${ncUser}:${ncPassword}`,
		headers: {
			'OCS-APIRequest': 'true',
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(postData),
		},
	}

	const result = await new Promise<string>((resolve, reject) => {

		const req = http.request(
			`${ncUrl}/ocs/v2.php/apps/secrets/api/v1/secrets?format=json`,
			rOptions,
			(response) => {
				response.setEncoding('utf8')
				const chunks: string[] = []
				response.on('data', (chunk) => {
					chunks.push(chunk)
				})
				response.on('end', () => {
					resolve(chunks.join(''))
				})
			})

		req.on('error', (e) => {
			console.error(e.message)
			reject(e)
		})

		req.write(postData)
		req.end()
	})

	let resultData: any
	try {
		resultData = JSON.parse(result)
	} catch (e) {
		if (e instanceof SyntaxError) {
			console.error('Could not parse response ', result)
		}
		throw e
	}

	if (resultData.ocs.meta.status !== 'ok') {
		console.error(resultData)
		throw new CommandExecutionError(resultData.ocs.meta.message)
	}

	const secret = resultData.ocs.data
	const keyBuf = await webcrypto.subtle.exportKey('raw', privKey)
	const keyBufB64 = cryptolib.arrayBufferToB64String(new Uint8Array(keyBuf))
	// console.log(cryptolib.b64StringToArrayBuffer(keyBufB64))
	//
	// console.log(await cryptolib.importDecryptionKey(keyBufB64, iv))
	console.log({
		title: secret.title,
		decryptionKey: keyBufB64,
		expires: secret.expires,
		shareUrl: `${ncUrl}/index.php/apps/secrets/share/${secret.uuid}#${keyBufB64}`,
		ocsUrl: `${ncUrl}/ocs/v2.php/apps/secrets/api/v1/share/${secret.uuid}`,
	})

}

// eslint-disable-next-line @typescript-eslint/no-empty-function
/**
 *
 * @param fargs
 */
export async function retrieveSecret(fargs: string[]) {

	let sharePw: string

	let shareUrl: URL

	const posArgs = []
	for (let i = 0; i < fargs.length; i++) {
		if (fargs[i] === '-p' || fargs[i] === '--password') {
			sharePw = fargs[++i]
		} else if (fargs[i].startsWith('--password=')) {
			sharePw = fargs[i].substring('--password='.length)
		} else {
			posArgs.push(fargs[i])
		}
	}

	if (posArgs.length > 0) {
		shareUrl = new URL(posArgs[0])
	} else {
		throw new InvalidArgumentError('ERROR: Missing parameter "nextcloud-url"')
	}

	const baseUrl = `${shareUrl.protocol}//${shareUrl.host}${shareUrl.port ? `:${shareUrl.port}` : ''}`
	let uuid = shareUrl.pathname
	uuid = uuid.substring(uuid.lastIndexOf('/') + 1)

	const postData = JSON.stringify({
		uuid,
		password: null,
	})
	const options: RequestOptions = {
		method: 'POST',
		headers: {
			'OCS-APIRequest': 'true',
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(postData),
		},
	}

	const result = await new Promise<string>((resolve, reject) => {
		console.log('request url: ' + `${baseUrl}/ocs/v2.php/apps/secrets/api/v1/share/${uuid}?format=json`,)

		const req = http.request(
			`${baseUrl}/ocs/v2.php/apps/secrets/api/v1/share?format=json`,
			options,
			(response) => {
				response.setEncoding('utf8')
				const chunks: string[] = []
				response.on('data', (chunk) => {
					chunks.push(chunk)
				})
				response.on('end', () => {
					resolve(chunks.join(''))
				})
			})

		req.on('error', (e) => {
			console.error(e.message)
			reject(e)
		})

		req.write(postData)
		req.end()
	})

	const resultData = JSON.parse(result)

	if (resultData.ocs.meta.status !== 'ok') {
		throw new CommandExecutionError(resultData?.ocs?.meta?.message + '\n' + resultData?.ocs?.data?.message)
	}

	const secret = resultData.ocs.data
	const iv = cryptolib.b64StringToArrayBuffer(secret.iv)
	const key = await cryptolib.importDecryptionKey(shareUrl.hash.substring(1), iv)

	console.log(await cryptolib.decrypt(secret.encrypted, key, iv))

}
