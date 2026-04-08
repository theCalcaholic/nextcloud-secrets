// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Locator, Page } from '@playwright/test'

type SecretNavEntry = { locator: Locator, title: undefined } | { locator: undefined, title: string }

/**
 * open the actions menu of a given app-navigation entry
 *
 * @param page
 * @param secretEntry
 */
export async function openSecretActions(page: Page, secretEntry: SecretNavEntry) {
	await page.waitForSelector('.app-navigation-entry')
	let locator: Locator
	if (secretEntry.locator !== undefined) {
		locator = secretEntry.locator
	} else {
		locator = page.locator(`.app-navigation-entry:has(a[title="${secretEntry.title}"])`)
	}
	const utils = locator.locator('.app-navigation-entry__utils')
	await utils.hover()
	await utils.locator('button').click()
	return page.locator('.app-navigation ul[role="menu"]:has(li.action)')
}

/**
 * set the title of the active secret
 *
 * @param page
 * @param title
 */
export async function setSecretTitle(page: Page, title: string) {
	const entryActions = await openSecretActions(page, { locator: page.locator('.app-navigation-entry-wrapper.active'), title: undefined })
	await entryActions.locator('.action-button[aria-label="Change Title"]').click()
	await page.fill('.app-navigation-entry-wrapper.active .app-navigation-entry--editing input.app-navigation-input-confirm__input', title)
	await page.click('.app-navigation-entry-wrapper.active .button-vue[aria-label="Confirm changes"]')
}

type SetSecret = {
	title?: string
	content: string
	password?: string
}

/**
 * create a new secret, optionally set its title
 *
 * @param page
 * @param title
 * @param title.title
 * @param content
 * @param title.content
 * @param password
 * @param title.password
 */
export async function createSecret(page: Page, { title, content, password }: SetSecret) {
	if (!page.url().match(/^.*\/index.php\/apps\/secrets\/?(\?.*)?(#.*)?$/)) {
		await page.goto('/index.php/apps/secrets')
	} else {
		await page.waitForLoadState('load')
	}
	await page.click('.app-navigation-caption__actions button[title="New secret"]')
	await page.waitForSelector('label:has-text("Expires on:")')
	if (title !== undefined) {
		await setSecretTitle(page, title)
	}
	if (password !== undefined) {
		await page.fill('.secret-container input[type=password]', password)
	}
	await page.fill('textarea', content)
	await page.click('input.primary[type="button"]')
	await page.waitForSelector('.secret-container .notecard--success')
}

/**
 *
 * @param page the Page
 * @param shareUrl the URL to the shared secret
 */
export async function revealSharedSecretNoPassword(page: Page, shareUrl: string) {
	await page.goto(shareUrl)
	const revealButton = await page.waitForSelector('button:has-text("I understand. Reveal and destroy Secret.")')
	await revealButton.click()
	await page.waitForSelector('.secret-container textarea')
}
