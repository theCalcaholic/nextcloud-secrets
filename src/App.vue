<template>
    <!--
    SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
    SPDX-License-Identifier: AGPL-3.0-or-later
    -->
	<div id="content" class="app-secrets">
		<AppNavigation>
			<AppNavigationNew v-if="!loading"
				:text="t('secrets', 'New secret')"
				:disabled="false"
				button-id="new-secrets-button"
				button-class="icon-add"
				@click="newSecret" />
			<ul>
				<AppNavigationItem v-for="secret in secrets"
					:key="secret.uuid"
					:title="secret.title ? secret.title : t('secrets', 'New secret')"
					:class="{active: currentSecretUUId === secret.uuid}"
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
			</ul>
		</AppNavigation>
		<AppContent>
			<div v-if="currentSecret">
				<input ref="title"
					v-model="currentSecret.title"
					type="text"
					:disabled="updating">
				<p>{{ currentFormattedUUID }}</p>
				<p>{{ currentSecretLink }}</p>
				<textarea ref="content" v-model="currentSecret.content" :disabled="updating" />
				<input type="button"
					class="primary"
					:value="t('secrets', 'Save')"
					:disabled="updating || !savePossible"
					@click="saveSecret">
			</div>
			<div v-else id="emptycontent">
				<div class="icon-file" />
				<h2>{{
				 t('secrets', 'Create a secret to get started') }}</h2>
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
	},
	data() {
		return {
			secrets: [],
			currentSecretUUId: null,
			updating: false,
			loading: true,
		}
	},
	computed: {
		/**
		 * Return the currently selected secret object
		 * @returns {Object|null}
		 */
		currentSecret() {
			if (this.currentSecretUUId === null) {
				return null
			}
			return this.secrets.find((secret) => secret.uuid === this.currentSecretUUId)
		},

		currentSecretURL() {
			let k = window.crypto.subtle.generateKey();
			k.buffer
			return window.crypto.subtle.exportKey("raw", this.currentSecret.key)
		},

		/**
		 * Returns true if a secret is selected and its title is not empty
		 * @returns {Boolean}
		 */
		savePossible() {
			return this.currentSecret && this.currentSecret.uuid === ''
		},
		currentFormattedUUID() {
			if (this.currentSecretUUId === null)
				return null;
			let uuid = this.currentSecretUUId
			return `${uuid.substring(0, 8)}-${uuid.substring(8, 4)}-${uuid.substring(12, 4)}-${uuid.substring(16, 4)}`
				+ `-${uuid.substring(20, 12)}`;
		}
	},
	/**
	 * Fetch list of secrets when the component is loaded
	 */
	async mounted() {
		try {
			const response = await axios.get(generateUrl('/apps/secrets/secrets'))
			this.secrets = response.data;
		} catch (e) {
			console.error(e)
			showError(t('secrets', 'Could not fetch secrets'))
		}
		this.loading = false
	},

	methods: {
		/**
		 * Create a new secret and focus the secret content field automatically
		 * @param {Object} secret Secret object
		 */
		openSecret(secret) {
			if (this.updating) {
				return
			}
			this.currentSecretUUId = secret.uuid
			this.$nextTick(() => {
				this.$refs.content.focus()
			})
		},
		/**
		 * Action tiggered when clicking the save button
		 * create a new secret or save
		 */
		saveSecret() {
			if (this.currentSecretUUId === "") {
				this.createSecret(this.currentSecret)
			} else {
				this.updateSecret(this.currentSecret)
			}
		},
		/**
		 * Create a new secret and focus the secret content field automatically
		 * The secret is not yet saved, therefore an id of "" is used until it
		 * has been persisted in the backend
		 */
		async newSecret() {
			if (this.currentSecretUUId !== "") {
				this.currentSecretUUId = ""
				this.secrets.push({
					uuid: "",
					title: 'new secret',
					_content: '',
					key: await this.generateCryptoKey()
				})
				this.$nextTick(() => {
					this.$refs.title.focus()
				})
			}
		},
		/**
		 * Abort creating a new secret
		 */
		cancelNewSecret() {
			this.secrets.splice(this.secrets.findIndex((secret) => secret.uuid === ""), 1)
			this.currentSecretUUId = null
		},
		async generateCryptoKey() {
			return await window.crypto.subtle.generateKey({
					name: "AES-GCM",
					length: 256
				},
				true,
				["encrypt", "decrypt"]);
		},
		async encryptSecret(secret, key) {
			let encoder = new TextEncoder();
			const iv = window.crypto.getRandomValues(new Uint16Array(12));
			const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv },
				key,
				encoder.encode(secret.content)
			);

			return {
				uuid: secret.uuid,
				title: secret.title,
				encrypted: String.fromCharCode.apply(null, new Uint16Array(encrypted)),
				iv: String.fromCharCode.apply(null, iv)
			}
		},
		stringToArrayBuffer(str) {
			const buff = new ArrayBuffer(str.length * 2)
			const buffView = new Uint16Array(buff)
			for(let i = 0, strLen = str.length; i < strLen; i++) {
				buffView[i] = str.charCodeAt(i);
			}
			return buff;
		},
		async decryptSecret(secret, key) {
			const iv = this.stringToArrayBuffer(secret.iv);
			const encrypted = this.stringToArrayBuffer(secret.encrypted);
			const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, encrypted);
			let decoder = new TextDecoder();
			console.log("decrypted:");
			console.log(decrypted);
			console.log(String.fromCharCode.apply(null, decrypted));
			console.log(decoder.decode(decrypted));

			return {
				uuid: secret.uuid,
				title: secret.title,
				iv: secret.iv,
				content: decoder.decode(decrypted),
				encrypted: secret.encrypted
			};
		},
		/**
		 * Create a new secret by sending the information to the server
		 * @param {Object} secret Secret object
		 */
		async createSecret(secret) {
			this.updating = true
			try {
				const key = await this.generateCryptoKey();
				const encryptedSecret = await this.encryptSecret(secret, key);
				console.log("encrypted:");
				console.log(encryptedSecret);
				const response = await axios.post(generateUrl('/apps/secrets/secrets'), encryptedSecret)
				const decryptedSecret = await this.decryptSecret(response.data, key)
				console.log("decrypted:");
				console.log(decryptedSecret);
				const index = this.secrets.findIndex((match) => match.uuid === this.currentSecretUUId)
				this.$set(this.secrets, index, decryptedSecret)
				this.currentSecretUUId = response.data.uuid
			} catch (e) {
				console.error(e)
				showError(t('secrets', 'Could not create the secret'))
			}
			this.updating = false
		},
		/**
		 * Update an existing secret on the server
		 * @param {Object} secret Secret object
		 */
		async updateSecret(secret) {
			this.updating = true
			try {
				await axios.put(generateUrl(`/apps/secrets/secrets/${secret.uuid}`), secret)
			} catch (e) {
				console.error(e)
				showError(t('secrets', 'Could not update the secret'))
			}
			this.updating = false
		},
		/**
		 * Delete a secret, remove it from the frontend and show a hint
		 * @param {Object} secret Secret object
		 */
		async deleteSecret(secret) {
			try {
				await axios.delete(generateUrl(`/apps/secrets/secrets/${secret.uuid}`))
				this.secrets.splice(this.secrets.indexOf(secret), 1)
				if (this.currentSecretUUId === secret.uuid) {
					this.currentSecretUUId = null
				}
				showSuccess(t('secrets', 'Secret deleted'))
			} catch (e) {
				console.error(e)
				showError(t('secrets', 'Could not delete the secret'))
			}
		},
	},
}
</script>
<style scoped>
	#app-content > div {
		width: 100%;
		height: 100%;
		padding: 20px;
		display: flex;
		flex-direction: column;
		flex-grow: 1;
	}

	input[type='text'] {
		width: 100%;
	}

	textarea {
		flex-grow: 1;
		width: 100%;
	}
</style>
