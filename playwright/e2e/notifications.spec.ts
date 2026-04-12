// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { runOcc } from '@nextcloud/e2e-test-server'
import { expect } from '@playwright/test'
import { test } from '../support/fixtures/random-user.ts'
import { createSecret, openSecretActions, setActivityConfig, setSecretTitle } from '../support/helpers/procedures.ts'

test.describe.configure({ mode: 'parallel' })
test.describe('Secrets CRUD Operations', () => {
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
		await expect(page.locator('li:has-text(You created secret \'activity test\')')).toBeVisible()
	})
})
