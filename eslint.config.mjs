// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later
import { recommended } from '@nextcloud/eslint-config'
import { defineConfig, globalIgnores } from 'eslint/config'
// import { fixupConfigRules } from '@eslint/compat'
// import peekyPlugin from '@peeky/eslint-plugin'

export default defineConfig([
	...recommended,
	// {
	// 	name: 'peeky',
	// 	extends: [fixupConfigRules(peekyPlugin.configs.recommended)],
	// },
	{
		name: 'secrets-overrides',
		files: ['src/**/*.js', 'src/**/*.ts', 'src/**/*.vue'],
		rules: {
			'jsdoc/require-param-description': ['off'],
			'jsdoc/require-param-type': ['off'],
			'jsdoc/check-param-names': ['off'],
		},
	},
	globalIgnores(['src/api/']),
])
