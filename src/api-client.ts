import type { CreateClientConfig } from '@/api/client.gen'

import axios from '@nextcloud/axios'
import { getBaseUrl } from '@nextcloud/router'

export const createClientConfig: CreateClientConfig = (config) => ({
	...config,
	axios,
	baseUrl: getBaseUrl(),
})
