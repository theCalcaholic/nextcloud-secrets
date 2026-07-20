// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { runOcc } from '@nextcloud/e2e-test-server'
import { type Locator, type Page } from '@playwright/test'
import { expect } from '@playwright/test'

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
	expireInDays?: number
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
 * @param expireInDays
 * @param title.password
 * @param title.expireInDays
 */
export async function createSecret(page: Page, { title, content, password, expireInDays }: SetSecret) {
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
	if (expireInDays !== undefined) {
		const defaultExpiryDate = new Date()
		defaultExpiryDate.setDate((new Date()).getDate() + 7)
		const expiryDate = new Date()
		expiryDate.setDate(expiryDate.getDate() + expireInDays)
		const isoDateString = expiryDate.toISOString().split('T')[0]
		const datepickerFormatDate = `dp-${isoDateString}`
		// const formatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })
		// const formattedDate = formatter.format(expiryDate)
		const expiryField = page.locator('.secret-container input[placeholder="Expiration Date"]')
		await expiryField.click()
		await page.waitForSelector('.dp__menu[aria-label="Datepicker menu"]:visible')
		const dayButtonLocator = page.locator(`#${datepickerFormatDate}`)
		let buttonSelector = '.dp__menu button[aria-label="Next month"]'
		if ((defaultExpiryDate).getMonth() > expiryDate.getMonth()) {
			buttonSelector = '.dp__menu button[aria-label="Previous month"]'
		}
		const monthButtonLocator = page.locator(buttonSelector)
		let tries = 1
		while (!await dayButtonLocator.isVisible({ timeout: 100 })) {
			if (tries > 6) {
				throw new Error(`Could not find date time picker button (${dayButtonLocator}) after paging through 6 months`)
			}
			await monthButtonLocator.click()
			tries += 1
		}
		await dayButtonLocator.click()
		// await expiryField.fill(formattedDate)
		// await expiryField.blur()
	}
	await page.fill('textarea', content)
	await page.click('button:has-text("Save")')
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

export interface ActivityConfig {
	stream: boolean
	email: boolean
}

export interface ActivitiesConfig {
	secret_creation: ActivityConfig
	secret_retrieval: ActivityConfig
	secret_expiry: ActivityConfig
}

/**
 *
 * @param page
 * @param target
 * @param value
 */
async function checkCheckbox(page: Page, target: Locator, value: boolean) {
	if (await target.isChecked() !== value) {
		await target.click()
		await page.waitForSelector('.toast-success:has-text("Your settings have been updated.")')
	}
}

/**
 *
 * @param page
 * @param config
 */
export async function setActivityConfig(page: Page, config: ActivitiesConfig) {
	const originalUrl = page.url()
	await page.goto('/index.php/settings/user/notifications')
	await page.waitForSelector('#secret_creation_email')

	let cb = page.locator('label[for=secret_creation_email]')
	await checkCheckbox(page, cb, config.secret_creation.email)
	cb = page.locator('label[for=secret_creation_notification]')
	await checkCheckbox(page, cb, config.secret_creation.stream)
	cb = page.locator('label[for=secret_retrieval_email]')
	await checkCheckbox(page, cb, config.secret_retrieval.email)
	cb = page.locator('label[for=secret_retrieval_notification]')
	await checkCheckbox(page, cb, config.secret_retrieval.stream)
	cb = page.locator('label[for=secret_expiry_email]')
	await checkCheckbox(page, cb, config.secret_expiry.email)
	cb = page.locator('label[for=secret_expiry_notification]')
	await checkCheckbox(page, cb, config.secret_expiry.stream)

	await page.goto(originalUrl)
}

interface OccJob {
	id: string
	class: string
	last_run: string
	argument: string
}

/**
 *
 */
export async function findSecretsExpiryJob() {
	const jobs = JSON.parse(await runOcc(['background-job:list', '--output=json'])) as OccJob[]
	const expireSecretsJob = jobs.find((job) => job.class === 'OCA\\Secrets\\Cron\\SecretExpiry')
	if (!expireSecretsJob) {
		throw Error(`Could not find secrets expiry job in: \n${JSON.stringify(jobs)}`)
	}
	return expireSecretsJob
}

/**
 *
 * @param page
 */
export async function runExpiryJob(page: Page) {
	const expireSecretsJob = await findSecretsExpiryJob()
	const occResult = await runOcc(['background-job:execute', '--force-execute', expireSecretsJob.id])
	expect(occResult).toContain('Job executed!')
	let hasBeenExecuted = false
	for (let i = 0; i < 120; i++) {
		const job = await findSecretsExpiryJob()
		if (job.last_run !== expireSecretsJob.last_run) {
			hasBeenExecuted = true
			break
		}
		await page.waitForTimeout(500)
	}
	expect(hasBeenExecuted, 'secret expiry job has not been executed after 60s').toBeTruthy()
	await page.waitForTimeout(5000)
}
