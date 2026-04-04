// SPDX-FileCopyrightText: Nextcloud contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
import { createAppConfig } from '@nextcloud/vite-config'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'path'
import cleanPlugin from 'vite-plugin-clean'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default createAppConfig(
	{
		main: resolve(join('src', 'main.js')),
		public: resolve(join('src', 'public.js')),
	},
	{
		createEmptyCSSEntryPoints: true,
		extractLicenseInformation: true,
		thirdPartyLicense: false,
		build: {
			cssCodeSplit: false,
		},
		config: {
			build: {
				rollupOptions: {
				// Needed for Nextcloud >= 32. In 33 it got fixed
				// with https://github.com/nextcloud/server/pull/56941
					preserveEntrySignatures: 'strict',
				},
			},
			plugins: [
				cleanPlugin,
				viteStaticCopy({
					targets: [{
						src: 'js-static/*.js',
						dest: 'js',
						rename: { stripBase: 1 },
					}],
				}),
			],
			resolve: {
				alias: [
					{
						find: '@',
						replacement: fileURLToPath(new URL('./src', import.meta.url)),
					},
				],
			},
		},
		test: {
			// Use the DOM environment for all tests by default
			runtimeEnv: 'dom',
			// Vitest configuration
			name: 'vitest',
			include: ['tests/unit/**/*.spec.ts', 'cypress/unit/**/*.spec.ts'],
			exclude: ['cypress/e2e/**'],
		},
	},
)
