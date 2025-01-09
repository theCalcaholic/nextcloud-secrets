// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

import console from 'node:console'
import fs from 'fs'
import { Buffer } from 'node:buffer'
import { webcrypto } from 'node:crypto'
import http, { RequestOptions } from 'http'
import CryptoLib from './crypto.import.js'
import { CommandExecutionError } from './CommandExecutionError.ts'
import { prompt } from './lib.ts'
import process from "process";
import * as url from "node:url";
import * as https from "node:https";

const btoa = (str: string) => Buffer.from(str, 'binary').toString('base64')
const atob = (str: string) => Buffer.from(str, 'base64').toString('binary')

const cryptolib = new CryptoLib(webcrypto, { atob, btoa }, false)

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
	handleGlobalOptions(options)
	await getApiInfo(ncUrl)

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

		const req = http_client(ncUrl).request(
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
	console.log(JSON.stringify(
		{
			title: secret.title,
			decryptionKey: keyBufB64,
			expires: secret.expires,
			shareUrl: `${ncUrl}/index.php/apps/secrets/share/${secret.uuid}#${keyBufB64}`,
			ocsUrl: `${ncUrl}/ocs/v2.php/apps/secrets/api/v1/share/${secret.uuid}`,
		},
		null,
		2))

}

// eslint-disable-next-line @typescript-eslint/no-empty-function
/**
 *
 * @param shareUrlStr
 * @param options
 * @param options.decryptionKey
 * @param options.password
 * @param options.insecure
 */
export async function retrieveSecret(shareUrlStr: string, options: {
	key: string | undefined,
	password: string | undefined,
	insecure: boolean | undefined
}) {
	handleGlobalOptions(options)

	let ocs_pattern = new RegExp(`^/ocs/v\\d+\\.php/apps/secrets/api/v\\d+/share/(?<sId>.*)$`)
	let sharePattern = new RegExp(`^/index\\.php/apps/secrets/(share|show)/(?<sId>.*)$`)

	let shareUrl = new URL(shareUrlStr)

	let secretId: string
	const {sId} = ocs_pattern.exec(shareUrl.pathname)?.groups ?? {}
	if (sId === undefined) {
		const {sId} = sharePattern.exec(shareUrl.pathname)?.groups ?? {}
		if (sId === undefined) {
			throw new CommandExecutionError(`Failed to parse secretId from url`)
		}
		secretId = sId
	} else {
		secretId = sId
	}

	const secretKey = options.key ?? shareUrl.hash.substring(1)
	if (!secretKey || secretKey.length == 0) {
		throw new CommandExecutionError(`Missing secret decryption key: (got '${secretKey}')`)
	}

	const baseUrl = `${shareUrl.protocol}//${shareUrl.host}`

	await getApiInfo(baseUrl)

	const postData = JSON.stringify({
		uuid: secretId,
		password: options.password || null,
	})
	const reqOptions: RequestOptions = {
		method: 'POST',
		headers: {
			'OCS-APIRequest': 'true',
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(postData),
		},
	}

	const result = await new Promise<string>((resolve, reject) => {
		const req = http_client(shareUrlStr).request(
			`${baseUrl}/ocs/v2.php/apps/secrets/api/v1/share?format=json`,
			reqOptions,
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
	const key = await cryptolib.importDecryptionKey(secretKey, iv)

	console.log(await cryptolib.decrypt(secret.encrypted, key, iv))

}

function http_client(url: string): any {

	let http_client = http
	if (url.startsWith("https:")) {
		http_client = https
	}

	return http_client
}

/**
 * @param ncUrl
 */
async function getApiInfo(ncUrl: string): Promise<string> {

	const result = await new Promise<string>((resolve, reject) => {
		const req = http_client(ncUrl).request(`${ncUrl}/ocs/v2.php/apps/secrets/version?format=json`,
			{
				method: 'GET',
				headers: {
					'OCS-APIRequest': 'true',
					'Content-Type': 'application/json',
					'Content-Length': 0,
				},
			},
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
		req.end()
	})

	let resultData: string
	try {
		resultData = JSON.parse(result)
	} catch (e) {
		throw new CommandExecutionError(`Failed to retrieve secrets API information. Is Nextcloud Secrets installed and has version >= 2? (error was: ${e})`)
	}
	if (resultData.ocs.meta.status !== 'ok') {
		throw new CommandExecutionError(resultData?.ocs?.meta?.message + '\n' + resultData?.ocs?.data?.message)
	}

	return resultData.ocs.data.version
}

/**
 *
 * @param ncUrl
 * @param options
 * @param options.insecure
 */
export async function showApiInfo(ncUrl: string, options: {silent: boolean | undefined, insecure: boolean | undefined}) {
	handleGlobalOptions(options)
	const version = await getApiInfo(ncUrl)
	if (!options.silent) {
		console.log(`Secrets API version ${version}`)
	}
}
