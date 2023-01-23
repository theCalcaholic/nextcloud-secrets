<template>
	<!--
    SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
    SPDX-License-Identifier: AGPL-3.0-or-later
    -->
	<div id="content-wrapper">
		<AppNavigation>
			<template #list>
				<AppNavigationNew v-if="!loading"
					:text="t('secrets', 'New secret')"
					:disabled="false"
					button-id="new-secrets-button"
					button-class="icon-add"
					@click="newSecret" />
				<AppNavigationItem v-for="secret in secrets"
					:key="secret.uuid"
					:title="secret.title"
					:class="{
						active: currentSecretUUId === secret.uuid,
						invalidated: secret.encrypted === null
					}"
					:editable="true"
					:edit-label="t('secrets', 'Change Title')"
					:icon="secret.uuid === '' ? 'icon-template-add' : (secret.encrypted === null ? 'icon-toggle' : 'icon-password')"
					@update:title="(title) => updateSecretTitle(secret, title)"
					@click="openSecret(secret)">
					<template slot="actions">
						<ActionButton v-if="secret.uuid === ''"
							icon="icon-close"
							@click="cancelNewSecret(secret)">
							{{
								t('secrets', 'Cancel secret creation') }}
						</ActionButton>
						<ActionButton v-else
							icon="icon-delete"
							@click="deleteSecret(secret)">
							{{
								t('secrets', 'Delete secret') }}
						</ActionButton>
					</template>
				</AppNavigationItem>
			</template>
		</AppNavigation>
		<AppContent>
			<SecretEditor v-if="currentSecret && currentSecretUUId === ''"
				v-model="currentSecret"
				:locked="locked"
				@save-secret="saveSecret" />
			<Secret v-else-if="currentSecret"
				v-model="currentSecret"
				:locked="locked"
				:success="t('secrets', 'Your secret is stored end-to-end encrypted on the server. ' +
					'It can only be decrypted by someone who has been given the link.\n' +
					'Once retrieved successfully, the secret will be deleted on the server')" />
			<div v-else id="emptycontent">
				<div class="icon-file" />
				<h2>{{ t('secrets', 'Create a secret to get started') }}</h2>
			</div>
		</AppContent>
	</div>
</template>

<script>
import ActionButton from '@nextcloud/vue/dist/Components/NcActionButton.js'
import AppContent from '@nextcloud/vue/dist/Components/NcAppContent.js'
import AppNavigation from '@nextcloud/vue/dist/Components/NcAppNavigation.js'
import AppNavigationItem from '@nextcloud/vue/dist/Components/NcAppNavigationItem.js'
import AppNavigationNew from '@nextcloud/vue/dist/Components/NcAppNavigationNew.js'
import Secret from './Secret.vue'
import SecretEditor from './SecretEditor.vue'

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
		Secret,
		SecretEditor,
	},
	data() {
		return {
			secrets: [],
			currentSecretUUId: null,
			currentSecretKeyBuf: null,
			updating: false,
			loading: true,
		}
	},
	computed: {
		/**
		 * Return the currently selected secret object
		 *
		 * @return {object | null}
		 */
		currentSecret: {
			get() {
				if (this.currentSecretUUId === null) {
					return null
				}
				return this.secrets.find((secret) => secret.uuid === this.currentSecretUUId)
			},
			set(val) {

				const index = this.secrets.findIndex((secret) => secret.uuid === this.currentSecretUUId)
				this.$set(this.secrets, index, val)
			},
		},

		/**
		 * Returns true if a secret is selected and its title is not empty
		 *
		 * @return {boolean}
		 */
		savePossible() {
			return this.currentSecret && this.currentSecret.key
		},
		/**
		 *
		 * @return {boolean}
		 */
		locked() {
			return this.updating || this.loading
		},
	},
	/**
	 * Fetch list of secrets when the component is loaded
	 */
	async mounted() {
		try {
			const response = await axios.get(generateUrl('/apps/secrets/secrets'))
			this.secrets = response.data.map(secret => {
				return {
					...secret,
					expires: new Date(secret.expires),
					iv: secret.iv === null ? null : this.$cryptolib.stringToArrayBuffer(secret.iv),
					_decrypted: null,
					key: null,
				}
			})
			console.log(this.secrets)

		} catch (e) {
			console.error(e)
			showError(t('secrets', 'Could not fetch secrets'))
		}
		this.loading = false
	},

	methods: {
		/**
		 * Create a new secret and focus the secret content field automatically
		 *
		 * @param {object} secret Secret object
		 */
		openSecret(secret) {
			if (this.updating) {
				return
			}
			this.currentSecretUUId = secret.uuid
		},
		saveCurrentSecret(decrypted) {
			this.currentSecret._decrypted = decrypted
			this.saveSecret(this.currentSecret)
		},
		/**
		 * Action tiggered when clicking the save button
		 * create a new secret or save
		 *
		 * @param {object} secret Secret object
		 */
		saveSecret(secret) {
			if (this.currentSecretUUId !== '') { showError("Can't save existing secret") }
			this.createSecret(secret)
		},
		/**
		 * Create a new secret and focus the secret content field automatically
		 * The secret is not yet saved, therefore an id of "" is used until it
		 * has been persisted in the backend
		 */
		async newSecret() {
			const key = await this.$cryptolib.generateCryptoKey()
			const iv = this.$cryptolib.generateIv()
			if (this.currentSecretUUId !== '') {
				this.currentSecretUUId = ''
				let expiryDate = new Date()
				expiryDate.setDate((new Date()).getDate() + 7)
				this.secrets.push({
					uuid: '',
					title: t('secrets', 'New Secret'),
					password: null,
					pwHash: null,
					key,
					iv,
					expires: expiryDate,
					_decrypted: '',
				})
			}
		},
		/**
		 * Abort creating a new secret
		 */
		cancelNewSecret() {
			this.secrets.splice(this.secrets.findIndex((secret) => secret.uuid === ''), 1)
			this.currentSecretUUId = null
		},
		updateCurrentSecret(secret) {

			const index = this.secrets.findIndex((match) => match.uuid === this.currentSecretUUId)
			this.$set(this.secrets, index, secret)
		},
		/**
		 * Create a new secret by sending the information to the server
		 *
		 * @param {object} secret Secret object
		 */
		async createSecret(secret) {
			this.updating = true
			try {
				const encryptedPromise = this.$cryptolib.encrypt(secret._decrypted, secret.key, secret.iv)
				let expiresStr = secret.expires.toISOString()
				const encryptedSecret = {
					title: secret.title,
					password: secret.password,
					expires: expiresStr,
					encrypted: await encryptedPromise,
					iv: this.$cryptolib.arrayBufferToB64String(secret.iv),
				};
				const response = await axios.post(generateUrl('/apps/secrets/secrets'), encryptedSecret)
				const decrypted = await this.$cryptolib.decrypt(
					response.data.encrypted,
					secret.key,
					this.$cryptolib.b64StringToArrayBuffer(response.data.iv))
				const index = this.secrets.findIndex((match) => match.uuid === this.currentSecretUUId)
				this.$set(this.secrets, index, {
					...response.data,
					expires: new Date(response.data.expires),
					_decrypted: decrypted,
					key: secret.key,
					iv: this.$cryptolib.b64StringToArrayBuffer(response.data.iv),
				})
				this.currentSecretUUId = response.data.uuid
				this.currentSecretKeyBuf = await window.crypto.subtle.exportKey('raw', this.currentSecret.key)
			} catch (e) {
				console.error(e)
				showError(t('secrets', 'Could not create the secret'))
			}
			this.updating = false
		},
		/**
		 * Delete a secret, remove it from the frontend and show a hint
		 *
		 * @param {object} secret Secret object
		 */
		async deleteSecret(secret) {
			try {
				if (!secret.uuid) { throw new Error('Secret has no UUID!') }
				await axios.delete(generateUrl(`/apps/secrets/secrets/${secret.uuid}`))
				this.secrets.splice(this.secrets.indexOf(secret), 1)
				if (this.currentSecretUUId === secret.uuid) {
					this.currentSecretUUId = null
					this.currentSecretKeyBuf = null
				}
				showSuccess(t('secrets', 'Secret deleted'))
			} catch (e) {
				console.error(e)
				showError(t('secrets', 'Could not delete the secret'))
			}
		},
		async updateSecretTitle(secret, title) {
			if (secret.uuid) {
				await axios.put(generateUrl(`/apps/secrets/secrets/${secret.uuid}/title`), { title })
			}
			secret.title = title
		},
	},
}
</script>

<style>
.app-content {
	padding: 44px 20px 20px;
}

.active .app-navigation-entry {
	background-color: var(--color-background-dark);
}

#content-wrapper {
	display: flex;
	width: 100%;
	border-radius: var(--body-container-radius);
	overflow: hidden;
}
</style>
