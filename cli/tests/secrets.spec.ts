// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { createSecret, getApiInfo, retrieveSecret } from '../secrets.ts'
import { StringSourceString } from '@/model'

const NCURL = 'http://localhost:8089'
const NCUSER = 'secretsclitest'
const NCPASS = 'secretsclitest'

describe('Secrets CLI test suit', () => {
	it('retrieves API info', async () => {
		const apiVersion = await getApiInfo(NCURL)
		expect(apiVersion).not.toBeNull()
	})

	it('creates a new secret', async () => {
		const secSource = new StringSourceString('testsecret')
		const passSource = new StringSourceString(NCPASS)
		const result = await createSecret(NCURL, NCUSER, passSource, secSource, {})
		console.log(result)
	})

	it('creates a new secret with a title', async () => {
		const secSource = new StringSourceString('testsecret')
		const passSource = new StringSourceString(NCPASS)
		const result = await createSecret(NCURL, NCUSER, passSource, secSource, {
			title: 'my secret',
		})
		expect(result.title).toEqual('my secret')
	})

	it('creates a new secret with expiration', async () => {
		const secSource = new StringSourceString('testsecret')
		const passSource = new StringSourceString(NCPASS)
		const expiryDays = 3
		const expiryDate = new Date()
		expiryDate.setDate((new Date()).getDate() + expiryDays)
		const result = await createSecret(NCURL, NCUSER, passSource, secSource, {
			expire: expiryDays,
		})
		expect(result.expires.getDate() - expiryDate.getDate()).toBeCloseTo(0)
	})

	it('retrieves a created secret form its share url', async () => {
		const secSource = new StringSourceString('testsecret-retr')
		const passSource = new StringSourceString(NCPASS)
		const result = await createSecret(NCURL, NCUSER, passSource, secSource, {})
		console.log(result)

		const retrieved = await retrieveSecret(result.shareUrl, {})
		expect(retrieved).toEqual(await secSource.read())
	})

	it('retrieves a created secret form its ocs url + key', async () => {
		const secSource = new StringSourceString('testsecret-retr2')
		const passSource = new StringSourceString(NCPASS)
		const result = await createSecret(NCURL, NCUSER, passSource, secSource, {})
		console.log(result)

		const retrieved = await retrieveSecret(result.ocsUrl, {
			key: result.decryptionKey,
		})
		expect(retrieved).toEqual(await secSource.read())
	})

	it('retrieves a created secret form with password protection', async () => {
		const secSource = new StringSourceString('testsecret-retr3')
		const passSource = new StringSourceString(NCPASS)
		const result = await createSecret(NCURL, NCUSER, passSource, secSource, {
			protect: 'secpw',
		})
		console.log(result)

		const retrieved = await retrieveSecret(result.ocsUrl, {
			key: result.decryptionKey,
			password: 'secpw',
		})
		expect(retrieved).toEqual(await secSource.read())
	})
})
