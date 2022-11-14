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
					:title="secret.title"
					:class="{
						active: currentSecretUUId === secret.uuid,
						invalidated: secret.encrypted === null
					}"
				   :editable="true"
				   :editLabel="t('secrets', 'Change Title')"
				   :icon="secret.encrypted === null ? 'icon-toggle' : 'icon-password'"
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
			</ul>
		</AppNavigation>
		<AppContent>
			<SecretEditor v-if="currentSecret && currentSecretUUId === ''"
						  :locked="locked"
						  v-on:save-secret="saveCurrentSecret"/>
			<Secret v-else-if="currentSecret"
					v-model="currentSecret"
					:locked="locked" />
			<div v-else id="emptycontent">
				<div class="icon-file" />
				<h2>{{ t('secrets', 'Create a secret to get started') }}</h2>
			</div>
		</AppContent>
	</div>
</template>

<script>
import ActionButton from '@nextcloud/vue/dist/Components/NcActionButton'
import AppContent from '@nextcloud/vue/dist/Components/NcAppContent'
import AppNavigation from '@nextcloud/vue/dist/Components/NcAppNavigation'
import AppNavigationItem from '@nextcloud/vue/dist/Components/NcAppNavigationItem'
import AppNavigationNew from '@nextcloud/vue/dist/Components/NcAppNavigationNew'
import Secret from "./Secret";
import SecretEditor from "./SecretEditor";

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
		SecretEditor
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
		 * @returns {Object|null}
		 */
		currentSecret: {
			get()
			{
				if (this.currentSecretUUId === null) {
					return null
				}
				return this.secrets.find((secret) => secret.uuid === this.currentSecretUUId)
			},
			set(val) {
				// this.$set(this.secrets, index, val);
				console.log("setSecret(", val, ")");

				const index = this.secrets.findIndex((secret) => secret.uuid === this.currentSecretUUId)
				this.$set(this.secrets, index, val);
				// const currentSecret = this.currentSecret;
				// if (currentSecret === null) {
				// 	return;
				// }
				// currentSecret.uuid = val.uuid;
				// currentSecret.title = val.title;
				// currentSecret.encrypted = val.encrypted;
				// currentSecret.iv = val.iv;
			}
		},

		/**
		 * Returns true if a secret is selected and its title is not empty
		 * @returns {Boolean}
		 */
		savePossible() {
			return this.currentSecret && this.currentSecret.key;
		},
		/**
		 *
		 * @returns {boolean}
		 */
		locked() {
			return this.updating || this.loading;
		}
	},
	/**
	 * Fetch list of secrets when the component is loaded
	 */
	async mounted() {
		try {
			const response = await axios.get(generateUrl('/apps/secrets/secrets'))
			this.secrets = response.data;
			console.log("secrets: ", this.secrets);
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
			// this.$nextTick(() => {
			// 	this.$refs.currentSecret.focus()
			// })
		},
		async generateCryptoKey() {
			return await window.crypto.subtle.generateKey({
					name: "AES-GCM",
					length: 256
				},
				true,
				["encrypt", "decrypt"]);
		},
		saveCurrentSecret(decrypted) {
			this.currentSecret._decrypted = decrypted;
			this.saveSecret(this.currentSecret);
		},
		/**
		 * Action tiggered when clicking the save button
		 * create a new secret or save
		 */
		saveSecret(secret) {
			if (this.currentSecretUUId !== "")
				showError("Can't save existing secret");
			this.createSecret(secret);
		},
		/**
		 * Create a new secret and focus the secret content field automatically
		 * The secret is not yet saved, therefore an id of "" is used until it
		 * has been persisted in the backend
		 */
		async newSecret() {
			const key = await this.generateCryptoKey();
			const iv = window.crypto.getRandomValues(new Uint8Array(12));
			if (this.currentSecretUUId !== "") {
				this.currentSecretUUId = ""
				this.secrets.push({
					uuid: "",
					title: t('secrets', 'New Secret'),
					key: key,
					iv: iv,
					_decrypted: ""
				})
				// this.$nextTick(() => {
				// 	this.$refs.title.focus()
				// })
			}
		},
		/**
		 * Abort creating a new secret
		 */
		cancelNewSecret() {
			this.secrets.splice(this.secrets.findIndex((secret) => secret.uuid === ""), 1)
			this.currentSecretUUId = null
		},
		updateCurrentSecret(secret) {

			// this.currentSecret.title = secret.title;
			// this.currentSecret.encrypted = secret.encrypted;
			const index = this.secrets.findIndex((match) => match.uuid === this.currentSecretUUId);
			this.$set(this.secrets, index, secret);
			// this.currentSecret.title = title;
		},
		/**
		 * Create a new secret by sending the information to the server
		 * @param {Object} secret Secret object
		 */
		async createSecret(secret) {
			this.updating = true
			try {
				const encrypted = await this.$secrets.encrypt(secret._decrypted, secret.key, secret.iv);
				const encryptedSecret = {
					title: secret.title,
					encrypted: encrypted,
					iv: String.fromCharCode.apply(null, secret.iv)
				};
				const response = await axios.post(generateUrl('/apps/secrets/secrets'), encryptedSecret)
				const decrypted = await this.$secrets.decrypt(
					response.data.encrypted,
					secret.key,
					this.$secrets.stringToArrayBuffer(response.data.iv))
				const index = this.secrets.findIndex((match) => match.uuid === this.currentSecretUUId)
				this.$set(this.secrets, index, {
					...response.data,
					_decrypted: decrypted,
					key: secret.key,
					iv: this.$secrets.stringToArrayBuffer(response.data.iv)
				})
				this.currentSecretUUId = response.data.uuid
				this.currentSecretKeyBuf = await window.crypto.subtle.exportKey("raw", this.currentSecret.key)
			} catch (e) {
				console.error(e)
				showError(t('secrets', 'Could not create the secret'))
			}
			this.updating = false
		},
		/**
		 * Delete a secret, remove it from the frontend and show a hint
		 * @param {Object} secret Secret object
		 */
		async deleteSecret(secret) {
			try {
				if (!secret.uuid)
					throw new Error("Secret has no UUID!");
				await axios.delete(generateUrl(`/apps/secrets/secrets/${secret.uuid}`))
				this.secrets.splice(this.secrets.indexOf(secret), 1)
				if (this.currentSecretUUId === secret.uuid) {
					this.currentSecretUUId = null
					this.currentSecretKeyBuf = null;
				}
				showSuccess(t('secrets', 'Secret deleted'))
			} catch (e) {
				console.error(e)
				showError(t('secrets', 'Could not delete the secret'))
			}
		},
		async updateSecretTitle(secret, title) {
			if (secret.uuid) {
				await axios.put(generateUrl(`/apps/secrets/secrets/${secret.uuid}/title`), {title: title});
			}
			secret.title = title;
		}
	},
}
</script>
<style>
.app-navigation-entry.invalidated .app-navigation-entry-link {
	color: var(--color-warning);
	opacity: 0.7;
}
</style>
