// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { expect } from '@playwright/test'
import { test } from '../support/fixtures/random-user.ts'
import { createSecret, openSecretActions, setSecretTitle } from '../support/helpers/procedures.ts'

test.describe.configure({ mode: 'parallel' })
test.describe('Secrets CRUD Operations', () => {
	test('should display empty state when no secrets exist', async ({ page }) => {
		await page.goto('/index.php/apps/secrets')
		await expect(page.locator('#emptycontent')).toContainText('Create a secret to get started')
	})

	test('should create a new secret', async ({ page }) => {
		const secret = {
			title: 'test-secret-1',
			content: 'This is a test secret content',
		}

		await createSecret(page, secret)

		await expect(page.locator(`.app-navigation-entry:has(a[title="${secret.title}"]) .app-navigation-entry__name`)).toHaveText(secret.title)
		await expect(page.locator('.secret-container textarea')).toHaveValue(secret.content)
	})

	test('should create a new secret with expiry date', async ({ page }) => {
		const secret = {
			title: 'test-secret',
			content: 'secret content',
			expireInDays: 1,
		}

		const expectedExpiry = new Date()
		expectedExpiry.setUTCDate(expectedExpiry.getUTCDate() + secret.expireInDays)
		expectedExpiry.setUTCHours(0, 0, 0, 0)

		await createSecret(page, secret)
		await expect(page.locator(`.app-navigation-entry:has(a[title="${secret.title}"]) .app-navigation-entry__name`)).toHaveText(secret.title)
		await expect(page.locator('.secret-container textarea')).toHaveValue(secret.content)
		const actualExpiry = new Date(await page.locator('.secret-container input[name="expires"]').inputValue())
		expect(actualExpiry).toEqual(expectedExpiry)
	})

	test('should read but not decrypt an existing secret', async ({ page }) => {
		const secret = {
			title: 'test-read-1',
			content: 'Content to read',
		}

		await createSecret(page, secret)
		await page.reload()
		await page.waitForSelector('.app-navigation-entry')
		await expect(page.locator(`.app-navigation-entry:has-text("${secret.title}")`)).toBeVisible()
		await page.click(`.app-navigation-entry:has-text("${secret.title}")`)
		await page.waitForSelector('.secret-container')

		await expect(page.locator('.secret-container')).toContainText('Could not decrypt secret (key not available locally).')
	})

	test('should update secret title', async ({ page }) => {
		const secret = {
			title: 'Original Title',
			content: 'top secret',
		}
		const newTitle = 'Updated Title '

		await createSecret(page, secret)
		await setSecretTitle(page, newTitle)
		await page.waitForSelector(`.app-navigation-entry:has-text("${newTitle}")`)

		await expect(page.locator('.app-navigation-entry__name')).toContainText(newTitle)
	})

	test('should delete a secret', async ({ page }) => {
		const secret = {
			title: 'secret to delete',
			content: 'content to delete',
		}

		await createSecret(page, secret)
		const entryActions = await openSecretActions(page, { title: secret.title, locator: undefined })
		await entryActions.locator('button:has-text("Delete secret")').click()

		// navigation entry list should be empty after deletion
		await page.waitForSelector('ul.app-navigation-list:not(:has(li.app-navigation-entry-wrapper))')
		await page.goto('/index.php/apps/secrets')
		await page.waitForSelector('.app-navigation')
		await expect(page.locator('.app-navigation ul.app-navigation-list')).not.toContainText(secret.title)
	})

	test('should cancel creating a new secret', async ({ page }) => {
		await page.goto('/index.php/apps/secrets')
		await page.click('.app-navigation-caption__actions button[title="New secret"]')
		await page.waitForSelector('div.icon-template-add:visible')
		await page.waitForSelector('label:has-text("Expires on:")')

		const activeEntryLocator = page.locator('.app-navigation-entry-wrapper.active .app-navigation-entry')
		const actionMenu = await openSecretActions(page, { locator: activeEntryLocator, title: undefined })
		await actionMenu.locator('button:has-text("Cancel secret creation")').click()

		await expect(page.locator('label:has-text("Expires on:")')).not.toBeVisible()
		await expect(page.locator('ul.app-navigation-list').locator('li')).toHaveCount(1)
	})
})
