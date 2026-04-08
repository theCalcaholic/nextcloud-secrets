// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
	input: 'openapi.json', // sign up at app.heyapi.dev
	output: 'shared/api',
	plugins: [{
		name: '@hey-api/client-axios',
		// runtimeConfigPath: '@/api-client.ts',
	}],
})
