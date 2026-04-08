// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later
import { recommended } from '@nextcloud/eslint-config'
import stylistic from '@stylistic/eslint-plugin'
import { defineConfig, globalIgnores } from 'eslint/config'
// import { fixupConfigRules } from '@eslint/compat'
// import peekyPlugin from '@peeky/eslint-plugin'

// console.log(recommended)
export default defineConfig([
	...recommended,
	{
		name: 'playwright',
		files: ['playwright/start-nextcloud-server.js'],
		languageOptions: {
			globals: {
				process: 'readonly',
			},
		},
	},
	{
		name: 'secrets-overrides',
		rules: {
			'jsdoc/require-param-description': 'off',
			'jsdoc/require-param-type': 'off',
			'jsdoc/check-param-names': 'off',
			'jsdoc/require-yields': 'off',
			'no-console': 'off',
		},
	},
	{
		plugins: { '@stylistic': stylistic },
		rules: {
			'@stylistic/max-statements-per-line': ['warn', { max: 2 }],
		},
	},
	globalIgnores(['shared/api/', 'playwright/start-nextcloud-server.ts']),
])
