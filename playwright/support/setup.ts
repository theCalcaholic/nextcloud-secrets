/**
 * SPDX-FileCopyrightText: 2024 Ferdinand Thiessen <opensource@fthiessen.de>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { configureNextcloud, getContainer, runExec, runOcc } from '@nextcloud/e2e-test-server'
import { test as setup } from '@playwright/test'
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { getBranch, syncApp } from '../util.ts'

/**
 * We use this to ensure Nextcloud is configured correctly before running our tests
 *
 * This can not be done in the webserver startup process,
 * as that only checks for the URL to be accessible which happens already before everything is configured.
 */
setup('Configure Nextcloud', async () => {
	setup.setTimeout(300_000)
	const ncVersion = process.env.NC_VERSION ?? getBranch()
	const cwd = process.cwd()
	const syncPath = path.join(cwd, 'build/test/secrets')
	await syncApp(cwd, syncPath, [path.join(cwd, 'build'), path.join(cwd, '.git'), path.join(cwd, '.pnpm'), path.join(cwd, 'node_modules')])
	const appsToInstall: string[] = ['viewer', 'activity'] // TODO: Readd notifications
	await configureNextcloud(appsToInstall, ncVersion)

	await runExec(['bash', '-c', 'cd apps/notifications && composer install minishlink/web-push'])

	// Fix for notifications on stable34 broken/missing dependencies
	// TODO: Remove once fixed
	const container = await getContainer()

	const coreApps = ['notifications']

	const tmpDir = tmpdir() + '/' + crypto.randomUUID()
	mkdirSync(tmpDir)
	for (const app of coreApps) {
		console.log(`installing ${app} ...`)
		const repo = `https://github.com/nextcloud/${app}`
		if (!existsSync(`${tmpDir}/${app}`)) {
			execSync(`git clone  --branch=${ncVersion} --depth=1 ${repo} ${tmpDir}/${app}`)
		}
		execSync('composer install', { cwd: `${tmpDir}/${app}` })
		execSync(`tar -caf ${app}.tar.gz ${app}`, { cwd: `${tmpDir}` })
		await runExec(['rm', '-rf', `apps/${app}`], { verbose: true, container })
		await container.putArchive(`${tmpDir}/${app}.tar.gz`, { path: '/var/www/html/apps/' })
		await runOcc(['app:enable', '--force', app], { container, verbose: true })
	}
	rmSync(tmpDir, { force: true, recursive: true })

	await runOcc(['app:enable', 'secrets'])
	await runOcc(['user:add', '--password-from-env', 'secretsclitest'], {
		env: ['NC_PASS=secretsclitest'],
	})
})
