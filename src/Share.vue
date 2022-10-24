<template>
	<!--
	SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
	SPDX-License-Identifier: AGPL-3.0-or-later
	-->
	<div id="content" class="app-secrets">
		<AppContent>
			<!--v-on:secret-changed="changeSecret"-->
			<Secret v-if="secret"
					v-model="secret"
					:locked="false" :readonly="true"></Secret>
			<div v-else id="emptycontent">
				<div class="icon-file" />
				<h2>{{ t('secrets', 'Create a secret to get started') }}</h2>
			</div>
		</AppContent>
	</div>
</template>

<script>
import ActionButton from '@nextcloud/vue/dist/Components/ActionButton'
import AppContent from '@nextcloud/vue/dist/Components/AppContent'
import AppNavigation from '@nextcloud/vue/dist/Components/AppNavigation'
import AppNavigationItem from '@nextcloud/vue/dist/Components/AppNavigationItem'
import AppNavigationNew from '@nextcloud/vue/dist/Components/AppNavigationNew'
import Secret from "./Secret";

import '@nextcloud/dialogs/styles/toast.scss'
import { generateUrl } from '@nextcloud/router'
import { showError, showSuccess } from '@nextcloud/dialogs'
import axios from '@nextcloud/axios'


export default {
	name: 'App',
	components: {
		ActionButton,
		AppContent,
		AppNavigation,
		AppNavigationItem,
		AppNavigationNew,
		Secret
	},
	data() {
		return {
			secret: null
		}
	},
	async mounted() {
		try {
			const uuidIndex = window.location.pathname.lastIndexOf('/');
			const uuid = window.location.pathname.substring(uuidIndex + 1);
			const response = await axios.get(generateUrl(`/apps/secrets/api/show/${uuid}`))
			const secret = response.data;
			const iv = this.$secrets.stringToArrayBuffer(response.data.iv);
			secret._decrypted = await this.$secrets.decrypt(secret.encrypted,
				await window.crypto.subtle.importKey(
					'raw',
					new Uint8Array(Array.from(window.atob(window.location.hash.substring(1))).map(ch => ch.charCodeAt(0))),
					{name: this.$secrets.ALGO, iv: iv},
					false,
					['decrypt']
				),
				iv)
			this.secret = secret;
		} catch (e) {
			console.error(e)
			showError(t('secrets', 'Could not fetch secrets'))
		}
		this.loading = false
	}
}
</script>
