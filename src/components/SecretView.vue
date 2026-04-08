<script setup lang="ts">
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

import type CryptoLib from '@shared/crypto.ts'
import type { Secret } from '@/model'

import { showError } from '@nextcloud/dialogs'
import { n, t } from '@nextcloud/l10n'
import { generateUrl } from '@nextcloud/router'
import { NcActionButton, NcActions, NcCheckboxRadioSwitch, NcNoteCard } from '@nextcloud/vue'
import { computed, inject, ref, watch } from 'vue'

import '@nextcloud/dialogs/styles/toast.scss'

const model = defineModel<Secret | undefined>(undefined)
defineProps<Props>()
const cryptolib: CryptoLib = inject('cryptolib')!
const debug: boolean = inject('debugsecrets') ?? false

interface Props {
	warning?: string
	success?: string
}
const keyBuf = ref<ArrayBuffer | null>(null)
const copyState = ref('ready')

const isDecrypted = computed(() => !!model.value?.key)

const url = computed(() => {
	if (debug) {
		console.debug(`decrypted? ${isDecrypted.value}, keyBuf: ${keyBuf.value}`)
	}
	if (!isDecrypted.value || !keyBuf.value || !model.value) {
		return null
	}
	const keyStr = cryptolib.arrayBufferToB64String(new Uint8Array(keyBuf.value))
	if (debug) {
		console.debug('serialized key: ', keyStr)
	}
	return window.location.protocol + '//' + window.location.host + generateUrl(`/apps/secrets/share/${model.value.uuid}#${keyStr}`)
})

const formattedDate = computed(() => {
	if (model.value === undefined) {
		return ''
	}
	const fDate = model.value.expires.getFullYear() + '-'
		+ `${model.value.expires.getMonth() + 1}-`.padStart(3, '0')
		+ `${model.value.expires.getDate()}`.padStart(2, '0')
	if (debug) {
		console.debug('date: ', fDate, model.value.expires)
	}
	return fDate
})

const daysToDeletion = computed(() => {
	if (!model.value?.expires) {
		return 999
	}
	const deletionDate = new Date(model.value.expires.toISOString())
	deletionDate.setDate(deletionDate.getDate() + 7)
	const today = new Date()
	today.setHours(0)
	today.setMinutes(0)
	today.setSeconds(0)
	today.setMilliseconds(0)
	return Math.floor(+deletionDate - +today / 86_400_000)
})

const copyButtonIcon = computed(() => {
	return {
		success: 'icon-checkmark',
		error: 'icon-error',
		ready: 'icon-clippy',
	}[copyState.value]
})

const isPasswordProtected = computed(() => model.value?.pwHash !== undefined)

watch(model, async (val) => {
	if (val?.key) {
		keyBuf.value = await window.crypto.subtle.exportKey('raw', val.key)
	}
}, {
	immediate: true,
})

// TODO: Keep only one implementation of 'copyToClipboard'
/**
 * Copy the given string to the clipboard
 *
 * @param url The string to copy to the clipboard
 * @return
 */
async function copyToClipboard(url: string) {
	try {
		await navigator.clipboard.writeText(url)
		copyState.value = 'success'
		setTimeout(() => { copyState.value = 'ready' }, 3000)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (e: any) {
		showError(e?.message ?? t('secrets', 'Failed to copy the URL to the clipboard'))
		console.error(e)
		copyState.value = 'error'
		setTimeout(() => { copyState.value = 'ready' }, 3000)
	}
}
</script>

<template>
	<div class="secret-container">
		<div>
			<NcNoteCard v-if="success" type="success">
				<p>{{ success }}</p>
			</NcNoteCard>
			<NcNoteCard v-if="warning" type="warning">
				<p>{{ warning }}</p>
			</NcNoteCard>
			<NcNoteCard v-if="daysToDeletion <= 7" type="warning">
				<p>{{ n('secrets', 'Will be deleted in %n day', 'Will be deleted in %n days', daysToDeletion) }}</p>
			</NcNoteCard>
			<p v-if="model?.encrypted" class="expires-container">
				<label for="expires">{{ t('secrets', 'Expires on:') }}</label>
				<input
					v-if="model.expires"
					:value="formattedDate"
					type="date"
					name="expires"
					data-debug="date-is-set"
					disabled>
				<input
					v-else
					type="text"
					name="expires"
					data-debug="date-is-empty"
					disabled
					value="never">
			</p>
			<NcCheckboxRadioSwitch v-model="isPasswordProtected" :disabled="true">
				{{ t('secrets', 'password protected') }}
			</NcCheckboxRadioSwitch>
			<p v-if="url" class="url-container">
				<label for="url">{{ t('secrets', 'Share Link:') }}</label>
				<input
					type="text"
					name="url"
					disabled
					:value="url"
					:size="url.length"
					class="url-field">
				<NcActions class="secret-actions">
					<NcActionButton
						:icon="copyButtonIcon"
						:aria-label="t('secrets', 'Copy Secret Link')"
						@click="copyToClipboard(url)" />
				</NcActions>
			</p>
		</div>
		<textarea
			v-if="model?._decrypted"
			v-model="model._decrypted"
			disabled />

		<div v-else-if="!model?.encrypted" id="emptycontent">
			<div class="icon-toggle" />
			<h5>{{ t('secrets', 'This secret has already been retrieved and its content was consequently deleted from the server.') }}</h5>
		</div>
		<div v-else id="emptycontent">
			<div class="icon-password" />
			<h5>{{ t('secrets', 'Could not decrypt secret (key not available locally).') }}</h5>
		</div>
	</div>
</template>

<style scoped>

	div.secret-container {
		width: 100%;
		min-height: 50%;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	textarea {
		flex-grow: 1;
		width: 100%;
		font-family: 'Lucida Console', monospace;
	}

	/*
	textarea.warning {
		color: var(--color-warning);
	}
	*/

	.secret-actions {
		display: inline-block;
	}

	.url-container, .expires-container {
		display: flex;
		flex-wrap: nowrap;
		flex-direction: row;
	}

	.url-container label, .expires-container label {
		line-height: 36px;
		flex-grow: 0;
		flex-shrink: 0;
		white-space: nowrap;
		width: 8em;
		margin: 3px;
	}

	.url-container actions {
		flex-grow: 0;
	}

	input.url-field {
		width: 100%;
	}

</style>
