<template>
	<!--
	SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
	SPDX-License-Identifier: AGPL-3.0-or-later
	-->
	<div id="content-wrapper" class="app-secrets">
		<NcAppContent class="centered">
			<h2>{{ t('secrets', 'The following secret has been shared with you securely:') }}</h2>
			<!--v-on:secret-changed="changeSecret"-->
			<div class="secret-container">
				<div>
					<NcNoteCard v-if="decrypted || error" type="warning">
						<p>
							{{ t('secrets', 'Please make sure you have copied and stored the secret before closing this page! It is now deleted on the server.') }}
						</p>
					</NcNoteCard>
				</div>
				<div v-if="decrypted" class="secret-actions">
					<NcButton type="secondary"
						:icon="copyButtonIcon"
						:wide="false"
						:aria-label="t('secrets', 'Copy the secret\'s content to the clipboard')"
						@click="copyToClipboard(decrypted)">
						<template #icon>
							<component :is="copyButtonIcon" />
						</template>
						<template>
							{{ t('secrets', 'Copy to Clipboard') }}
						</template>
					</NcButton>
					<NcButton type="secondary"
						:icon="downloadButtonIcon"
						:wide="false"
						:aria-label="t('secrets', 'Download the secret\'s content as a file')"
						@click="downloadAsFile(decrypted)">
						<template #icon>
							<component :is="downloadButtonIcon" />
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
					<h2>{{ t('secrets', 'Retrieving secret…') }}</h2>
				</div>
				<div v-else-if="error" id="emptycontent">
					<div class="icon-password" />
					<h2>{{ t('secrets', 'Error loading secret. Is your link correct?') + ` ERR: ${error}` }}</h2>
				</div>
				<div v-else id="reveal-wrapper">
					<NcEmptyContent>
						<template #icon>
							<NcIconSvgWrapper size="40px" :svg="secretsIcon" name="Secrets" />
						</template>
						<template #description>
							<NcNoteCard type="warning">
								{{ t('secrets', 'Revealing will delete the secret from the server. You will not be able to retrieve it again.') }}
							</NcNoteCard>
						</template>
						<template #action>
							<NcButton type="info"
								:wide="false"
								icon="icon-password"
								:aria-label="t('secrets', 'Reveal the secret and delete it on the server')"
								@click="loadSecret()">
								<template #icon>
									<IconReveal :size="20" />
								</template>
								<template>
									{{ t('secrets', 'I understand. Reveal and destroy Secret.') }}
								</template>
							</NcButton>
						</template>
					</NcEmptyContent>
				</div>
			</div>
		</NcAppContent>
	</div>
</template>

<script>
import { NcAppContent, NcNoteCard, NcActions, NcActionButton, NcButton, NcEmptyContent, NcIconSvgWrapper } from '@nextcloud/vue'
import IconReveal from 'vue-material-design-icons/Eye.vue'
import IconCheckmark from 'vue-material-design-icons/Check.vue'
import IconError from 'vue-material-design-icons/AlertOctagonOutline.vue'
import IconDownload from 'vue-material-design-icons/FileDownload.vue'
import IconCopy from 'vue-material-design-icons/ContentCopy.vue'
import IconBomb from 'vue-material-design-icons/Bomb.vue'
import IconSvg from 'vue-material-design-icons/Svg.vue'

import '@nextcloud/dialogs/styles/toast.scss'
import { showError } from '@nextcloud/dialogs'
import axios from '@nextcloud/axios'
import { generateOcsUrl } from '@nextcloud/router'

export default {
	name: 'Share',
	components: {
		NcAppContent,
		NcActions,
		NcActionButton,
		NcNoteCard,
		NcButton,
		NcEmptyContent,
		NcIconSvgWrapper,
		IconReveal,
		IconCheckmark,
		IconError,
		IconDownload,
		IconCopy,
		IconBomb,
		IconSvg,
	},
	data() {
		return {
			decrypted: null,
			loading: false,
			error: undefined,
			copyState: 'ready',
			downloadState: 'ready',
			secretsIcon: '<svg version="1.1" id="Layer_1" x="0" y="0" viewBox="0 0 500 500" style="enable-background:new 0 0 500 500" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><defs id="defs4668"><clipPath clipPathUnits="userSpaceOnUse" id="clipPath9346"><path id="lpe_path-effect9354" class="powerclip" d="M85.87 4.403h316.896v353.692H85.87Zm130.204 174.154c16.32 0 29.558-13.239 29.558-29.558 0-16.32-13.239-29.558-29.558-29.558 0 0-10.64-2.333-22.044 0-11.403 2.334-34.645 21.002-40.914 29.558-6.27 8.556-7.826 13.223-4.714 19.446 3.111 6.223 9.334 6.223 15.557 3.112 6.222-3.112 13.223-14.002 17.501-17.89 4.278-3.89 5.43 0 5.43 0l.03-.032c2.225 14.11 14.406 24.922 29.154 24.922zM343.354 155c14.001 0 25.358-11.357 25.358-25.358 0-14.001-11.357-25.358-25.358-25.358 0 0-9.132-2.007-18.917 0-9.785 2.007-29.714 18.03-35.096 25.358-5.383 7.327-6.721 11.34-4.045 16.677 2.676 5.351 8.012 5.351 13.348 2.676 5.336-2.676 11.34-12.026 15.012-15.355 3.671-3.33 4.651 0 4.651 0l.032-.031c1.913 12.119 12.367 21.39 25.015 21.39z"/></clipPath></defs><g id="g10966" transform="translate(6.337)"                                                                                          ><path class="st1" d="M279.779 370.82s12.496-57.274 9.372-78.1c8.33-21.869 6.248-47.902 6.248-52.067 0-4.166-2.083-14.58 6.248-14.58 8.33 0 12.496 9.373 14.579 14.58 2.082 5.206 4.165 13.537 4.165 27.074 0 13.538-2.083 22.91-3.124 30.72 4.165 24.471 0 55.712 0 55.712s19.785-14.58 27.075-13.538c5.207 0 6.248 2.083 10.413 6.248 4.166 4.166 16.662 24.992 19.786 30.2 3.124 5.206 14.578 23.95 15.62 28.115 3.124 11.455-2.083 19.786-6.248 31.24-4.166 11.455-8.331 18.745-12.496 23.951-5.207 5.207-5.207 4.166-11.455 7.29-6.248 3.124-10.413 8.33-14.579 20.827-12.496 7.289-94.762 14.089-95.803 9.372-1.042-4.718 16.661-78.1 16.661-88.514 0-10.414-.52-23.43.52-26.554 1.042-3.124 13.018-11.976 13.018-11.976z" id="path4657" style="stroke-width:1.04134"/><path class="st1" d="M373 71c-23-33-71-58-110-61s-89 5-118 31c0 0-26 22-38 47s-19 55-15 86 43 85 66 112 53 49 68 57c21.19 10.6 29.72 11.62 45.65 8.65C272.13 349.8 275 340 277 320c2-17 1-32 1-32s4-7 7-28c1-16-2-28 4-38 2.57-4.29 17-8 25 0 6.67 5.46 12.5 23.84 13 33s-.03 28.01-2 41c3 11 2.3 18.37 2 30 8.47-8.18 14.38-21.75 20-30 15-22 44-85 49-112s0-80-23-113z" id="path4663" clip-path="url(#clipPath9346)" transform="translate(-10.755 -9.27) scale(1.04134)"/></g></svg>',
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
		},
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
				const blob = new Blob([content], { type: 'text/plain' })
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
			// this.downloadState = 'success'
			setTimeout(() => { this.downloadState = 'ready' }, 3000)
		},

		async loadSecret() {
			this.loading = true
			try {
				let uuid = window.location.pathname
				uuid = uuid.substring(uuid.lastIndexOf('/') + 1)
				const response = await axios.post(generateOcsUrl('/apps/secrets/api/v1/share'), { uuid })
				const secret = response.data.ocs.data
				const iv = this.$cryptolib.b64StringToArrayBuffer(secret.iv)
				if (this.$debugsecrets) {
					console.debug('to decrypt:', secret.encrypted, secret.iv, window.location.hash.substring(1))
				}
				const key = await this.$cryptolib.importDecryptionKey(window.location.hash.substring(1), iv)
				if (this.$debugsecrets) {
					console.debug('key: ', key)
				}
				this.decrypted = await this.$cryptolib.decrypt(secret.encrypted, key, iv)
				if (this.$debugsecrets) {
					console.debug('decrypted', this.decrypted)
				}
			} catch (e) {
				console.error(e)
				showError(t('secrets', 'Could not decrypt secret'))
			}
			this.loading = false
		},
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
	@media screen and (max-width: 800px) {
		.secret-actions {
			flex-direction: column;
			justify-content: start;
			margin: 0 1rem;
		}
		.secret-actions>* {
			margin-left: 0;
			margin-bottom: 1rem;
			width: 100%;
		}
    div.secret-container {
      padding: 0;
    }
	}

</style>
<style>
	.app-content {
		padding: 44px 20px 20px;
	}
  @media screen and (max-width: 800px) {
    .app-content {
      padding: 44px 10px 10px;
    }
  }
</style>
