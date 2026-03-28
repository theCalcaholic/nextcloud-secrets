import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
	input: 'openapi.json', // sign up at app.heyapi.dev
	output: 'src/api',
	plugins: [{
		name: '@hey-api/client-axios',
		runtimeConfigPath: '@/api-client.ts',
	}],
})
