import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
	input: 'openapi.json', // sign up at app.heyapi.dev
	output: 'shared/api',
	plugins: [{
		name: '@hey-api/client-axios',
		// runtimeConfigPath: '@/api-client.ts',
	}],
})
