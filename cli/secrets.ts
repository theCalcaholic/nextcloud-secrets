// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { StringSource } from '@/model'

import { createClient, createConfig } from '@shared/api/client'
import {
	secretApiCreateSecret,
	secretApiGetVersion,
	secretApiRetrieveSharedSecret,
} from '@shared/api/sdk.gen.ts'
import CryptoLib from '@shared/crypto.ts'
import { ocsHeaders } from '@shared/model'
import { Buffer } from 'node:buffer'
import console from 'node:console'
import { CommandExecutionError } from '@/CommandExecutionError.ts'

/**
 *
 * @param baseURL
 * @param auth
 * @param auth.user
 * @param auth.password
 */
function createOcsApiClient(baseURL: string, auth?: { user: string, password: string }) {
	const cfg = createConfig({
		headers: {
			'OCS-APIRequest': true,
		},
		baseURL,
	})
	const client = createClient(cfg)
	if (auth) {
		client.instance.interceptors.request.use((config) => {
			console.log('setting up basic auth ...')
			console.log('Authorization: ', 'Basic ' + Buffer.from(`${auth.user}:${auth.password}`).toString('base64'))
			config.headers.set('Authorization', 'Basic ' + Buffer.from(`${auth.user}:${auth.password}`).toString('base64'))
			return config
		})
	}
	return client
}

const btoa = (str: string) => Buffer.from(str, 'binary').toString('base64')
const atob = (str: string) => Buffer.from(str, 'base64').toString('binary')

const cryptolib = new CryptoLib(globalThis.crypto, { atob, btoa }, false)

type AxiosRequestResult = {
	status?: number
	error?: unknown | {
		ocs: {
			meta: {
				message?: string
			}
		}
	}
	data?: {
		ocs: {
			meta: {
				message?: string
				status: string
				statuscode: number
			}
		}
	}
}

/**
 *
 * @param response
 * @param expectedStatusCode
 */
function handleApiError(response: AxiosRequestResult, expectedStatusCode: [number] | [number, number] = [200]) {
	// @ts-expect-error TODO: better explanation
	const msg = response.error?.ocs?.meta.message ?? response.data?.ocs.meta.message ?? 'unexpected API error'
	const statusMin = expectedStatusCode[0]
	const statusMax = expectedStatusCode.length === 1 ? expectedStatusCode[0] : expectedStatusCode[1]
	if (response.status === undefined || response.status < statusMin || response.status > statusMax) {
		throw new CommandExecutionError(`Received status code: ${response.status}, msg: ${msg}`)
	}
	if (response.data?.ocs.meta.status !== 'ok') {
		console.error(msg)
		throw new CommandExecutionError(`Received ocs status ${response.data?.ocs.meta.status} (${response.data?.ocs.meta.statuscode}), msg: ${msg}`)
	}
}

/**
 * Create a new secret
 *
 * @param ncUrl The base URL of the nextcloud instance
 * @param ncUser The nextcloud user for authentication
 * @param ncPassSource A StringSource for the nextcloud password (for use in basic auth)
 * @param secretSource A StringSource for the secret content
 * @param options Optional parameters
 * @param options.expire A number of days after which the secret should expire
 * @param options.protect If given, protect the secret with this password
 * @param options.title A title for the secret
 */
export async function createSecret(ncUrl: string, ncUser: string, ncPassSource: StringSource, secretSource: StringSource, options: {
	expire?: number
	protect?: string
	title?: string
}): Promise<{
	title: string
	decryptionKey: string
	expires: Date
	shareUrl: string
	ocsUrl: string
}> {
	await getApiInfo(ncUrl)

	const ncPassword = await ncPassSource.read()

	const plaintext = await secretSource.read()

	const privKey = await cryptolib.generateCryptoKey()
	const iv = cryptolib.generateIv()
	const encrypted = await cryptolib.encrypt(plaintext, privKey, iv)

	const expiryDate = new Date()
	expiryDate.setDate((new Date()).getDate() + (options.expire ?? 7))
	const response = await secretApiCreateSecret({
		...ocsHeaders,
		client: createOcsApiClient(ncUrl, { user: ncUser, password: ncPassword }),
		body: {
			title: options.title ?? 'Generated with secrets-cli',
			password: options.protect,
			expires: expiryDate.toISOString(),
			encrypted,
			iv: cryptolib.arrayBufferToB64String(iv),
		},
	})
	handleApiError(response, [201])

	const data = response.data?.ocs.data
	if (!data) {
		throw new CommandExecutionError(`Received empty response with message: ${response.error ?? response.data.ocs.meta.message ?? 'no message'}`)
	}
	const keyBuf = await globalThis.crypto.subtle.exportKey('raw', privKey)
	const keyBufB64 = cryptolib.arrayBufferToB64String(new Uint8Array(keyBuf))
	return {
		title: data.title,
		decryptionKey: keyBufB64,
		expires: new Date(data.expires),
		shareUrl: `${ncUrl}/index.php/apps/secrets/share/${data.uuid}#${keyBufB64}`,
		ocsUrl: `${ncUrl}/ocs/v2.php/apps/secrets/api/v1/share/${data.uuid}`,
	}
}

/**
 *
 * @param shareUrlStr The URL for secret retrieval (either an ocs URL or a share link)
 * @param options Optional parameters
 * @param options.key The decryption key for the secret (required if not contained in shareUrlStr)
 * @param options.password Required to retrieve password protected secrets
 */
export async function retrieveSecret(shareUrlStr: string, options: {
	key?: string
	password?: string
}) {
	const ocsPattern = new RegExp('^/ocs/v\\d+\\.php/apps/secrets/api/v\\d+/share/(?<sId>.*)$')
	const sharePattern = new RegExp('^/index\\.php/apps/secrets/(share|show)/(?<sId>.*)$')

	const shareUrl = new URL(shareUrlStr)

	let secretId: string
	const { sId } = ocsPattern.exec(shareUrl.pathname)?.groups ?? {}
	if (sId === undefined) {
		const { sId } = sharePattern.exec(shareUrl.pathname)?.groups ?? {}
		if (sId === undefined) {
			throw new CommandExecutionError('Failed to parse secretId from url')
		}
		secretId = sId
	} else {
		secretId = sId
	}

	const secretKey = options.key ?? shareUrl.hash.substring(1)
	if (!secretKey || secretKey.length === 0) {
		throw new CommandExecutionError(`Missing secret decryption key: (got '${secretKey}')`)
	}

	const baseUrl = `${shareUrl.protocol}//${shareUrl.host}`

	await getApiInfo(baseUrl)

	const response = await secretApiRetrieveSharedSecret({
		client: createOcsApiClient(baseUrl),
		...ocsHeaders,
		body: {
			uuid: secretId,
			password: options.password ?? undefined,
		},
	})
	handleApiError(response)

	const data = response.data?.ocs.data
	if (!data) {
		throw new CommandExecutionError(`Received empty response with message: ${response.error ?? response.data.ocs.meta.message ?? 'no message'}`)
	}
	const iv = cryptolib.b64StringToArrayBuffer(data.iv)
	const key = await cryptolib.importDecryptionKey(secretKey)

	return await cryptolib.decrypt(data.encrypted, key, iv)
}

/**
 * @param ncUrl The base URL of the nextcloud instance
 */
export async function getApiInfo(ncUrl: string): Promise<string> {
	const response = await secretApiGetVersion({
		...ocsHeaders,
		client: createOcsApiClient(ncUrl),
	})
	handleApiError(response)
	const data = response.data?.ocs.data
	if (!data) {
		throw new CommandExecutionError(`Received empty response with message: ${response.error ?? response.data?.ocs.meta.message ?? 'no message'}`)
	}

	return data.version
}

/**
 *
 * @param ncUrl THe base URL of the nextcloud instance
 * @param options Optional parameters
 * @param options.silent If true, don't print the api version (used for general connectivity/availability check)
 */
export async function showApiInfo(ncUrl: string, options: { silent: boolean | undefined }) {
	const version = await getApiInfo(ncUrl)
	if (!options.silent) {
		console.log(`Secrets API version ${version}`)
	}
}
