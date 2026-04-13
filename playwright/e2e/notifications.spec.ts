// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { expect } from '@playwright/test'
import { test } from '../support/fixtures/random-user.ts'
import {
	createSecret,
	revealSharedSecretNoPassword,
	runExpiryJob,
	setActivityConfig,
} from '../support/helpers/procedures.ts'
import { getBranch } from '../util.ts'

test.describe.configure({ mode: 'parallel' })
test.describe('Secrets Activity + Notifications', () => {
	test('should create creation activity', async ({ page }) => {
		await page.goto('/index.php/apps/secrets')
		await setActivityConfig(page, {
			secret_expiry: {
				stream: true,
				email: false,
			},
			secret_retrieval: {
				stream: true,
				email: false,
			},
			secret_creation: {
				stream: true,
				email: false,
			},
		})
		await createSecret(page, {
			title: 'activity test',
			content: 'my test secret',
		})
		await page.goto('/index.php/apps/activity/all')
		await expect(page.locator('.activity-app__container')).toContainText('You created secret \'activity test\'')
	})

	test('should create retrieval activity and notification', async ({ page }) => {
		await page.goto('/index.php/apps/secrets')
		await setActivityConfig(page, {
			secret_expiry: {
				stream: true,
				email: false,
			},
			secret_retrieval: {
				stream: true,
				email: false,
			},
			secret_creation: {
				stream: true,
				email: false,
			},
		})
		const secretTitle = 'activity test'
		await createSecret(page, {
			title: secretTitle,
			content: 'my test secret',
		})
		const shareUrl = await page.locator('.secret-container input.url-field').inputValue()

		await revealSharedSecretNoPassword(page, shareUrl)

		await page.goto('/index.php/apps/activity/all')
		await expect(page.locator('.activity-app__container'))
			.toContainText(`Secret '${secretTitle}' has been retrieved`)
		await page.locator('#notifications button[aria-label=Notifications]').click()
		await expect(page.locator('.notification-container'))
			.toContainText(`Secret '${secretTitle}' has been retrieved`)
	})

	test('should create expiry activity and notification', async ({ page }) => {
		test.skip((process.env.NC_VERSION ?? getBranch() ?? 'latest').endsWith('32'), 'occ command automation is currently broken with NC 32')
		test.setTimeout(150_000)
		const secret = {
			title: 'expiry activity test',
			content: 'This secret will be shared',
			expireInDays: -2,
		}
		await createSecret(page, secret)

		const expectedExpiry = new Date()
		expectedExpiry.setUTCDate(expectedExpiry.getUTCDate() + secret.expireInDays)
		expectedExpiry.setUTCHours(0, 0, 0, 0)

		const actualExpiry = new Date(await page.locator('.secret-container input[name="expires"]').inputValue())
		expect(actualExpiry).toEqual(expectedExpiry)

		await runExpiryJob(page)

		await page.goto('/index.php/apps/secrets')
		await page.locator(`.app-navigation-entry a[title="${secret.title}"]`).click()
		await page.screenshot({ path: 'expiry-test.png' })
		await expect(page.locator('.secret-container #emptycontent'))
			.toContainText('This secret has expired and its content was consequently deleted from the server.')

		await page.goto('/index.php/apps/activity/all')
		await expect(page.locator('.activity-app__container'))
			.toContainText(`Secret '${secret.title}' has expired without being retrieved`)
		await page.locator('#notifications button[aria-label=Notifications]').click()
		await expect(page.locator('.notification-container'))
			.toContainText(`Secret '${secret.title}' has expired without being retrieved`)
	})
})
