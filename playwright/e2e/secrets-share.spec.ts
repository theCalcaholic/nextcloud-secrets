// SPDX-FileCopyrightText: Nextcloud contributors
// SPDX-License-Identifier: AGPL-3.0-or-later

import { expect } from '@playwright/test'
import fs from 'fs'
import { test } from '../support/fixtures/random-user.ts'
import { createSecret, revealSharedSecretNoPassword } from '../support/helpers/procedures.ts'

test.describe.configure({ mode: 'parallel' })
test.describe('Secret Sharing Operations', () => {
	test('should retrieve a secret from its share url (display, copy, download)', async ({ page, context }) => {
		const secret = {
			title: 'shared secret',
			content: 'This secret will be shared',
		}
		await createSecret(page, secret)
		await context.grantPermissions(['clipboard-read'])
		const shareUrl = await page.locator('.secret-container input.url-field').inputValue()
		// await page.locator('.secret-container button[aria-label="Copy Secret Link"]').click()
		// await page.waitForTimeout(5000)
		// const clipboardContent = await page.evaluate(async () => await navigator.clipboard.readText())
		// expect(clipboardContent).toEqual(shareUrl)
		await revealSharedSecretNoPassword(page, shareUrl)

		// evaluation
		const textarea = await page.waitForSelector('.secret-container textarea')
		const textareaContent = await textarea.inputValue()
		expect(textareaContent).toEqual(secret.content)
		// await page.click('.secret-actions button:has-text("Copy to Clipboard")')
		// await page.waitForTimeout(5000)
		// const handle = await page.evaluateHandle(() => navigator.clipboard.readText())
		// const shareClipboardContent = await handle.jsonValue()
		// const shareClipboardContent = await page.evaluate(async () => await navigator.clipboard.readText())
		// expect(shareClipboardContent).toEqual(secret.content)
		const downloadEvent = page.waitForEvent('download')
		await page.locator('.secret-container button:has-text("Download")').click()
		const download = await downloadEvent
		const secretPath = await download.path()
		const downloadedSecret = fs.readFileSync(secretPath).toString()
		expect(downloadedSecret).toEqual(secret.content)
	})

	test('should not retrieve a shared secret twice', async ({ page }) => {
		const secret = {
			title: 'shared secret',
			content: 'This secret will be shared',
		}
		await createSecret(page, secret)
		const shareURL = await page.locator('.secret-container input.url-field').inputValue()
		await revealSharedSecretNoPassword(page, shareURL)
		await expect(page.locator('.secret-container textarea')).toHaveValue(secret.content)
		const response = await page.reload()
		expect(response?.status()).toEqual(404)
	})

	test('should require password for retrieval if set', async ({ page }) => {
		const sharedContent = 'This secret will be shared'
		const testTitle = 'shared secret'
		const secretPassword = 'revealme'
		await createSecret(page, { title: testTitle, content: sharedContent, password: secretPassword })
		const shareURL = await page.locator('.secret-container input.url-field').inputValue()
		await page.goto(shareURL)

		// should show password page
		await expect(page.getByText('This share is password-protected')).toBeVisible()
		await expect(page.locator('body')).not.toContainText(sharedContent)
		await expect(page.locator('body')).not.toContainText('Reveal and destroy Secret')

		await page.focus('input[type="password"][placeholder="Password"]')
		await page.locator('input[type="password"][placeholder="Password"]').fill(secretPassword)
		await expect(page.locator('#password-submit')).toBeEnabled()
		await page.click('#password-submit')
		await page.waitForURL('**/index.php/apps/secrets/share/**')
		await page.screenshot({ path: 'secrets-share-page.png' })
		const revealButton = await page.waitForSelector('button:has-text("I understand. Reveal and destroy Secret.")')
		await revealButton.click()
		await page.waitForSelector('.secret-container textarea')

		await expect(page.locator('.secret-container textarea')).toHaveValue(sharedContent)
	})
})
