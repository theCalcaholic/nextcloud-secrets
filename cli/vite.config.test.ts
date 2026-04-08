// SPDX-FileCopyrightText: Nextcloud contributors
// SPDX-License-Identifier: AGPL-3.0-or-later

import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: [
			'tests/*.spec.ts',
		],
	},
	resolve: {
		alias: [
			{
				find: '@',
				replacement: fileURLToPath(new URL('.', import.meta.url)),
			},
			{
				find: '@shared',
				replacement: fileURLToPath(new URL('../shared', import.meta.url)),
			},
		],
	},
})
