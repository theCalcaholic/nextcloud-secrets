/**
 * SPDX-FileCopyrightText: 2024 Ferdinand Thiessen <opensource@fthiessen.de>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { configureNextcloud, getContainer, runExec, runOcc } from '@nextcloud/e2e-test-server'
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
	const ncVersion = process.env.NC_VERSION ?? getBranch()
	const cwd = process.cwd()
	const syncPath = path.join(cwd, 'build/test/secrets')
	await syncApp(cwd, syncPath, [path.join(cwd, 'build'), path.join(cwd, '.git'), path.join(cwd, '.pnpm'), path.join(cwd, 'node_modules')])
	const appsToInstall: string[] = ['viewer', 'activity'] // TODO: Readd notifications
	await configureNextcloud(appsToInstall, ncVersion)

	// Fix for notifications on stable34 missing vendor directory
	// TODO: Remove once fixed
	const container = await getContainer()
	const repo = ncVersion === 'stable34' ? 'https://github.com/theCalcaholic/nc-notifications.git' : 'https://github.com/nextcloud/notifications.git'
	await runExec(
		['git', 'clone', '--depth=1', `--branch=${ncVersion}`, repo, 'apps/notifications'],
		{
			container,
			verbose: true,
		},
	)
	await runOcc(['app:enable', '--force', 'notifications'], { container, verbose: true })

	await runOcc(['app:enable', 'secrets'])
	await runOcc(['user:add', '--password-from-env', 'secretsclitest'], {
		env: ['NC_PASS=secretsclitest'],
	})
})
