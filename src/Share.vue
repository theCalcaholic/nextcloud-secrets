<template>
	<!--
	SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
	SPDX-License-Identifier: AGPL-3.0-or-later
	-->
	<div id="content-wrapper" class="app-secrets">
		<AppContent class="centered">
			<h2>The following secret has been shared with you securely:</h2>
			<!--v-on:secret-changed="changeSecret"-->
			<div class="secret-container">
				<div>
					<NoteCard type="warning" v-if="decrypted || error">
						<p>
							{{ t('secrets', 'Please make sure you have copied and stored the secret ' +
								'before closing this page! It is now deleted on the server.') }}
						</p>
					</NoteCard>
				</div>
				<div class="secret-actions" v-if="decrypted">
					<NcButton type="secondary" :icon="copyButtonIcon" :wide="false"
							  aria-label="Copy the secret's content to the clipboard"
							  @click="copyToClipboard(decrypted)">
						<template #icon>
							<component :is="copyButtonIcon"/>
						</template>
						<template>
							{{ t('secrets', 'Copy to Clipboard') }}
						</template>
					</NcButton>
					<NcButton type="secondary" :icon="downloadButtonIcon" :wide="false"
							  aria-label="Download the secret's content as a file"
							  @click="downloadAsFile(decrypted)">
						<template #icon>
							<component :is="downloadButtonIcon"/>
						</template>
						<template>
							{{ t('secrets', 'Download') }}
						</template>
					</NcButton>
				</div>
				<textarea v-if="decrypted"
					v-model="decrypted"
					disabled="disabled" />
				<div v-else-if="loading" id="emptycontent">
					<div class="icon-loading" />
					<h2>{{ t('secrets', 'Retrieving secret...') }}</h2>
				</div>
				<div v-else-if="error" id="emptycontent">
					<div class="icon-password" />
					<h2>{{ t('secrets', 'Error loading secret. Is your link correct?') + ` ERR: ${error}` }}</h2>
				</div>
				<div v-else id="reveal-wrapper">
					<NcButton type="primary" :wide="false" icon="icon-password" @click="loadSecret()"
							  aria-label="Reveal the secret and delete it on the server">
						<template #icon>
							<IconReveal :size="20"/>
						</template>
						<template>
							Reveal Secret
						</template>
					</NcButton>
					<NoteCard type="info">{{ t('secrets', 'Revealing will delete the secret from the server') }}</NoteCard>
				</div>
			</div>
		</AppContent>
	</div>
</template>

<script>
import AppContent from '@nextcloud/vue/dist/Components/NcAppContent.js'
import NoteCard from '@nextcloud/vue/dist/Components/NcNoteCard.js'
import Actions from '@nextcloud/vue/dist/Components/NcActions.js'
import ActionButton from '@nextcloud/vue/dist/Components/NcActionButton.js'
import {NcButton} from "@nextcloud/vue";
import IconReveal from 'vue-material-design-icons/Eye.vue'
import IconCheckmark from 'vue-material-design-icons/Check.vue'
import IconError from 'vue-material-design-icons/AlertOctagonOutline.vue'
import IconDownload from 'vue-material-design-icons/FileDownload.vue'
import IconCopy from 'vue-material-design-icons/ContentCopy.vue'

import '@nextcloud/dialogs/styles/toast.scss'
import { showError } from '@nextcloud/dialogs'
import axios from '@nextcloud/axios'
import { generateUrl } from '@nextcloud/router'

export default {
	name: 'Share',
	components: {
		AppContent,
		Actions,
		ActionButton,
		NoteCard,
		NcButton,
		IconReveal,
		IconCheckmark,
		IconError,
		IconDownload,
		IconCopy
	},
	data() {
		return {
			decrypted: null,
			loading: false,
			error: undefined,
			copyState: 'ready',
			downloadState: 'ready'
		}
	},
	computed: {

		copyButtonIcon() {
			if (this.copyState === 'success') { return IconCheckmark }
			if (this.copyState === 'error') { return IconError }
			return IconCopy
		},
		downloadButtonIcon() {
			if (this.downloadState === 'success') { return IconCheckmark }
			if (this.downloadState === 'error') { return IconError }
			return IconDownload
		}
	},
	methods: {

		async copyToClipboard(content) {
			try {
				await navigator.clipboard.writeText(content)
				this.copyState = 'success'
				setTimeout(() => { this.copyState = 'ready' }, 3000)
			} catch (e) {
				showError(e.message)
				console.error(e)
				this.copyState = 'error'
				setTimeout(() => { this.copyState = 'ready' }, 3000)
			}

		},
		async downloadAsFile(content) {
			try {
				const blob = new Blob([content], {type: 'text/plain'})
				const url = URL.createObjectURL(blob)
				const link = document.createElement('a')
				link.setAttribute('download', 'secret.txt')
				link.setAttribute('href', url)
				document.body.appendChild(link)
				link.click()
				document.body.removeChild(link)
			} catch (e) {
				showError(e.message)
				console.error(e)
				this.downloadState = 'error'
			}
			//this.downloadState = 'success'
			setTimeout(() => { this.downloadState = 'ready' }, 3000)
		},

		async loadSecret() {
			this.loading = true
			try {
				let uuid = window.location.pathname
				uuid = uuid.substring(uuid.lastIndexOf('/') + 1)
				const response = await axios.post(generateUrl('/apps/secrets/api/get'), { uuid })
				const secret = response.data
				const iv = this.$cryptolib.b64StringToArrayBuffer(secret.iv)
				if (this.$debugsecrets)
					console.debug("to decrypt:", secret.encrypted, secret.iv, window.location.hash.substring(1));
				const key = await this.$cryptolib.importDecryptionKey(window.location.hash.substring(1), iv)
				if (this.$debugsecrets)
					console.debug("key: ", key);
				this.decrypted = await this.$cryptolib.decrypt(secret.encrypted, key, iv)
				if (this.$debugsecrets)
					console.debug("decrypted", this.decrypted)
			} catch (e) {
				console.error(e)
				showError(t('secrets', 'Could not decrypt secret'))
			}
			this.loading = false
		}
	},
}
</script>

<style scoped>
	div.secret-container {
		width: 100%;
		min-height: 50%;
		padding: 20px;
		display: flex;
		flex-direction: column;
		height: calc(100% - 42px);
	}

	.centered {
		text-align: center;
		margin-left: auto;
		margin-right: auto;
	}

	textarea {
		width: 100%;
		margin: 0;
		resize: none;
		min-width: calc(100% - 4em);
		font-family: 'Lucida Console', monospace;
		flex-grow: 1;
		cursor: default;
	}

	input[type='button'] {
		display: block;
		margin: auto;
	}
	.secret-actions {
		display: flex;
		flex-direction: row;
		justify-content: end;
		margin: 1rem 0;
	}
	.secret-actions>* {
		margin-left: 1rem;
	}

	#content-wrapper {
		display: flex;
		width: 100%;
		border-radius: var(--body-container-radius);
		overflow: hidden;
	}

	#reveal-wrapper {
		width: 100%;
		text-align: center;
		min-width: calc(100% - 4em);
		flex-grow: 1;
		background-color: var(--color-background-hover);
		border-radius: var(--border-radius-large);
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

</style>
<style>
	.app-content {
		padding: 44px 20px 20px;
	}
</style>
