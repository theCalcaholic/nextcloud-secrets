<script setup lang="ts">
//  SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
//  SPDX-License-Identifier: AGPL-3.0-or-later

import type CryptoLib from '@shared/crypto.ts'

import { showError } from '@nextcloud/dialogs'
import { t } from '@nextcloud/l10n'
import { NcAppContent, NcButton, NcContent, NcEmptyContent, NcFormBox, NcFormBoxButton, NcIconSvgWrapper, NcNoteCard, NcTextArea } from '@nextcloud/vue'
import { secretApiRetrieveSharedSecret } from '@shared/api'
import { createClient } from '@shared/api/client'
import { ocsHeaders } from '@shared/model'
import { computed, inject, ref } from 'vue'
import IconError from 'vue-material-design-icons/AlertOctagonOutline.vue'
import IconCheckmark from 'vue-material-design-icons/Check.vue'
import IconCopy from 'vue-material-design-icons/ContentCopy.vue'
import IconReveal from 'vue-material-design-icons/Eye.vue'
import IconDownload from 'vue-material-design-icons/FileDownload.vue'
import { createClientConfig } from '@/api-client.ts'

import '@nextcloud/dialogs/styles/toast.scss'

type ActionState = 'ready' | 'success' | 'error'

const isSecureContext = window.isSecureContext

const client = createClient(createClientConfig())

const cryptolib: CryptoLib = inject('cryptolib')!
const debug: boolean = inject('debugsecrets') ?? false

const decrypted = ref<string | undefined>(undefined)
const loading = ref<boolean>(false)
const error = ref<string | undefined>(undefined)
const copyState = ref<ActionState>('ready')
const downloadState = ref<ActionState>('ready')
const secretsIcon = '<svg id="Layer_1" x="0" y="0" viewBox="0 0 500 500" style="enable-background:new 0 0 500 500" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><defs id="defs4668"><clipPath clipPathUnits="userSpaceOnUse" id="clipPath9346"><path id="lpe_path-effect9354" class="powerclip" d="M85.87 4.403h316.896v353.692H85.87Zm130.204 174.154c16.32 0 29.558-13.239 29.558-29.558 0-16.32-13.239-29.558-29.558-29.558 0 0-10.64-2.333-22.044 0-11.403 2.334-34.645 21.002-40.914 29.558-6.27 8.556-7.826 13.223-4.714 19.446 3.111 6.223 9.334 6.223 15.557 3.112 6.222-3.112 13.223-14.002 17.501-17.89 4.278-3.89 5.43 0 5.43 0l.03-.032c2.225 14.11 14.406 24.922 29.154 24.922zM343.354 155c14.001 0 25.358-11.357 25.358-25.358 0-14.001-11.357-25.358-25.358-25.358 0 0-9.132-2.007-18.917 0-9.785 2.007-29.714 18.03-35.096 25.358-5.383 7.327-6.721 11.34-4.045 16.677 2.676 5.351 8.012 5.351 13.348 2.676 5.336-2.676 11.34-12.026 15.012-15.355 3.671-3.33 4.651 0 4.651 0l.032-.031c1.913 12.119 12.367 21.39 25.015 21.39z"/></clipPath></defs><g id="g10966" transform="translate(6.337)"                                                                                          ><path class="st1" d="M279.779 370.82s12.496-57.274 9.372-78.1c8.33-21.869 6.248-47.902 6.248-52.067 0-4.166-2.083-14.58 6.248-14.58 8.33 0 12.496 9.373 14.579 14.58 2.082 5.206 4.165 13.537 4.165 27.074 0 13.538-2.083 22.91-3.124 30.72 4.165 24.471 0 55.712 0 55.712s19.785-14.58 27.075-13.538c5.207 0 6.248 2.083 10.413 6.248 4.166 4.166 16.662 24.992 19.786 30.2 3.124 5.206 14.578 23.95 15.62 28.115 3.124 11.455-2.083 19.786-6.248 31.24-4.166 11.455-8.331 18.745-12.496 23.951-5.207 5.207-5.207 4.166-11.455 7.29-6.248 3.124-10.413 8.33-14.579 20.827-12.496 7.289-94.762 14.089-95.803 9.372-1.042-4.718 16.661-78.1 16.661-88.514 0-10.414-.52-23.43.52-26.554 1.042-3.124 13.018-11.976 13.018-11.976z" id="path4657" style="stroke-width:1.04134"/><path class="st1" d="M373 71c-23-33-71-58-110-61s-89 5-118 31c0 0-26 22-38 47s-19 55-15 86 43 85 66 112 53 49 68 57c21.19 10.6 29.72 11.62 45.65 8.65C272.13 349.8 275 340 277 320c2-17 1-32 1-32s4-7 7-28c1-16-2-28 4-38 2.57-4.29 17-8 25 0 6.67 5.46 12.5 23.84 13 33s-.03 28.01-2 41c3 11 2.3 18.37 2 30 8.47-8.18 14.38-21.75 20-30 15-22 44-85 49-112s0-80-23-113z" id="path4663" clip-path="url(#clipPath9346)" transform="translate(-10.755 -9.27) scale(1.04134)"/></g></svg>'
let hasBeenRetrieved = false
const secretFilename = 'secret.txt'

const copyButtonIcon = computed(() => {
	return {
		success: IconCheckmark,
		error: IconError,
		ready: IconCopy,
	}[copyState.value]
})

const downloadButtonIcon = computed(() => {
	return {
		success: IconCheckmark,
		error: IconError,
		ready: IconDownload,
	}[downloadState.value]
})

// TODO: Keep only one implementation of 'copyToClipboard'
//  Copy argument value to clipboard
/**
 *
 * @param content
 */
async function copyToClipboard(content: string): Promise<void> {
	try {
		await navigator.clipboard.writeText(content)
		copyState.value = 'success'
		setTimeout(() => { copyState.value = 'ready' }, 3000)

		hasBeenRetrieved = true
	} catch (e) {
		showError((e as { message: string }).message ?? (e as { toString: () => string }).toString())
		console.error(e)
		copyState.value = 'error'
		setTimeout(() => { copyState.value = 'ready' }, 3000)
	}
}

// Download given data as (text) file
/**
 *
 * @param content
 */
async function downloadAsFile(content: string): Promise<void> {
	try {
		const blob = new Blob([content], { type: 'text/plain' })
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.setAttribute('download', secretFilename)
		link.setAttribute('href', url)
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		hasBeenRetrieved = true
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (e: any) {
		showError(e.message ?? e.toString())
		console.error(e)
		downloadState.value = 'error'
	}
	setTimeout(() => { downloadState.value = 'ready' }, 3000)
}

/**
 *
 */
async function loadSecret() {
	if (!isSecureContext) {
		return
	}
	loading.value = true
	try {
		let uuid = window.location.pathname
		uuid = uuid.substring(uuid.lastIndexOf('/') + 1)
		const response = await secretApiRetrieveSharedSecret({
			...ocsHeaders,
			client,
			body: {
				uuid,
			},
		})
		// const response = await axios.post(generateOcsUrl('/apps/secrets/api/v1/share'), { uuid })
		if (response.status !== 200 || response.data?.ocs.meta.status !== 'ok') {
			throw new Error('Failed to retrieve secret: ' + (response.error ?? response.data?.ocs.meta.message ?? 'unknown API error'))
		}
		const secret = response.data.ocs.data
		const iv = cryptolib.b64StringToArrayBuffer(secret.iv)
		if (debug) {
			console.debug('to decrypt:', secret.encrypted, secret.iv, window.location.hash.substring(1))
		}
		const key = await cryptolib.importDecryptionKey(window.location.hash.substring(1))
		if (debug) {
			console.debug('key: ', key)
		}
		decrypted.value = await cryptolib.decrypt(secret.encrypted, key, iv)
		if (debug) {
			console.debug('decrypted: ', decrypted.value)
		}
	} catch (e) {
		console.error(e)
		showError(t('secrets', 'Could not decrypt secret'))
	}
	loading.value = false
}

window.onbeforeunload = function() {
	console.log('has been retrieved: ', hasBeenRetrieved)
	return hasBeenRetrieved ? undefined : t('secrets', 'Are you sure you want to leave the page? You will not be able to retrieve the secret again.')
}
</script>

<template>
	<NcContent v-if="isSecureContext" appName="secrets">
		<NcAppContent :class="$style.content">
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
				<NcFormBox v-if="decrypted" row>
					<NcFormBoxButton
						:label="t('secrets', 'Copy to Clipboard')"
						:aria-label="t('secrets', 'Copy the secret to the clipboard')"
						@click="copyToClipboard(decrypted)">
						<template #icon>
							<component :is="copyButtonIcon" :size="20" />
						</template>
						<template #description>
							{{ t('secrets', 'Copy the secret to the clipboard') }}
						</template>
					</NcFormBoxButton>
					<NcFormBoxButton
						:label="t('secrets', 'Download')"
						:aria-label="t('secrets', 'Download the secret as a file')"
						@click="downloadAsFile(decrypted)">
						<template #icon>
							<component :is="downloadButtonIcon" :size="20" />
						</template>
						<template #description>
							{{ t('secrets', 'Download the secret as a file') }}
						</template>
					</NcFormBoxButton>
				</NcFormBox>
				<NcTextArea
					v-if="decrypted"
					class="secret-content"
					:label="t('secrets', 'Secret content')"
					:modelValue="decrypted"
					:disabled="true" />
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
							<NcIconSvgWrapper :size="40" :svg="secretsIcon" name="Secrets" />
						</template>
						<template #description>
							<NcNoteCard type="warning">
								{{ t('secrets', 'Revealing will delete the secret from the server. You will not be able to retrieve it again.') }}
							</NcNoteCard>
						</template>
						<template #action>
							<NcButton
								variant="primary"
								:wide="false"
								icon="icon-password"
								:aria-label="t('secrets', 'Reveal the secret and delete it on the server')"
								@click="loadSecret()">
								<template #icon>
									<IconReveal :size="20" />
								</template>
								<template #default>
									{{ t('secrets', 'I understand. Reveal and destroy Secret.') }}
								</template>
							</NcButton>
						</template>
					</NcEmptyContent>
				</div>
			</div>
		</NcAppContent>
	</NcContent>
	<NcContent v-else appName="secrets">
		<NcAppContent>
			<div id="emptycontent">
				<div class="icon-alert-outline" />
				<h2>{{ t('secrets', 'Secrets is only available when visiting Nextcloud at an encrypted (https) address.') }}</h2>
			</div>
		</NcAppContent>
	</NcContent>
</template>

<style scoped>
	div.secret-container {
    box-sizing: border-box;
		width: 100%;
		min-height: 50%;
		display: flex;
		flex-direction: column;
    flex-grow: 1;
	}

	input[type='button'] {
		display: block;
		margin: auto;
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
			margin-inline-start: 0;
			margin-bottom: 1rem;
			width: 100%;
		}
		div.secret-container {
			padding: 0;
		}
	}

</style>

<style module>
.content {
  display: flex;
  flex-direction: column;
  padding: 44px 20px 20px;
}
@media screen and (max-width: 800px) {
  .content {
    padding: 44px 10px 10px;
  }
}
</style>
