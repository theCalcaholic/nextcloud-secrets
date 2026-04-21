/**
 * SPDX-FileCopyrightText: 2024 Ferdinand Thiessen <opensource@fthiessen.de>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { configureNextcloud, runOcc } from '@nextcloud/e2e-test-server'
import { test as setup } from '@playwright/test'
import path from 'node:path'
import { getBranch, syncApp } from '../util.ts'

/**
 * We use this to ensure Nextcloud is configured correctly before running our tests
 *
 * This can not be done in the webserver startup process,
 * as that only checks for the URL to be accessible which happens already before everything is configured.
 */
setup('Configure Nextcloud', async () => {
	const cwd = process.cwd()
	const syncPath = path.join(cwd, 'build/test/secrets')
	await syncApp(cwd, syncPath, [path.join(cwd, 'build'), path.join(cwd, '.git'), path.join(cwd, '.pnpm'), path.join(cwd, 'node_modules')])
	const appsToInstall: string[] = ['viewer', 'notifications', 'activity']
	await configureNextcloud(appsToInstall, process.env.NC_VERSION ?? getBranch())
	await runOcc(['app:enable', 'secrets'])
	await runOcc(['user:add', '--password-from-env', 'secretsclitest'], {
		env: ['NC_PASS=secretsclitest'],
	})
})
