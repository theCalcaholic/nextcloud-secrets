// SPDX-FileCopyrightText: Nextcloud contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
/// <reference types="vitest/config" />
import { createAppConfig } from '@nextcloud/vite-config'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'path'
import cleanPlugin from 'vite-plugin-clean-pattern'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default createAppConfig(
	{
		main: resolve(join('src', 'main.js')),
		public: resolve(join('src', 'public.js')),
	},
	{
		createEmptyCSSEntryPoints: true,
		extractLicenseInformation: {
			validateLicenses: true,
			includeSourceMaps: false,
		},
		config: {
			build: {
				rollupOptions: {
					// Needed for Nextcloud >= 32. In 33 it got fixed
					// with https://github.com/nextcloud/server/pull/56941
					preserveEntrySignatures: 'strict',
					external: [
						/build\/test\/.*/,
					],
				},
				cssCodeSplit: false,
			},
			plugins: [
				cleanPlugin({
					targetFiles: ['js', 'css'],
				}),
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
					{
						find: '@shared',
						replacement: fileURLToPath(new URL('./shared', import.meta.url)),
					},
				],
			},
			test: {
				globals: true,
				environment: 'jsdom',
				environmentOptions: {
					jsdom: {
						url: 'http://localhost',
					},
				},
				include: [
					'src/tests/**/*.spec.ts',
					'shared/tests/**/*.spec.ts',
				],
			},
		},
	},
)
