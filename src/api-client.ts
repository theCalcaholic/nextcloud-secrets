// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { CreateClientConfig } from '@shared/api/client.gen.ts'

import axios from '@nextcloud/axios'
import { getBaseUrl } from '@nextcloud/router'

export const createClientConfig: CreateClientConfig = (config) => ({
	...config,
	axios,
	baseUrl: getBaseUrl(),
})
