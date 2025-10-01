<script setup>
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later
import { defineProps, ref, computed, inject, watch, toRef } from 'vue'
import { NcActionButton, NcActions, NcNoteCard, NcCheckboxRadioSwitch } from '@nextcloud/vue'

import '@nextcloud/dialogs/styles/toast.scss'
import { generateUrl } from '@nextcloud/router'
import { showError } from '@nextcloud/dialogs'

const $cryptolib = inject('cryptolib')
const $debugsecrets = inject('debugsecrets')

const props = defineProps({
	locked: Boolean,
	warning: String,
	success: String,
	secret: Object,
})

const secret = toRef(props, 'secret')

const keyBuf = ref(null)
const copyState = ref('ready')

const isDecrypted = computed(() => !!secret.value.key)

const url = computed(() => {
	if ($debugsecrets) { console.debug(`decrypted? ${isDecrypted.value}, keyBuf: ${keyBuf.value}`) }
	if (!isDecrypted.value || !keyBuf.value) { return null }
	const keyStr = $cryptolib.arrayBufferToB64String(new Uint8Array(keyBuf.value))
	if ($debugsecrets) { console.debug('serialized key: ', keyStr) }
	return window.location.protocol + '//' + window.location.host + generateUrl(
		`/apps/secrets/share/${secret.value.uuid}`
      + `#${keyStr}`,
	)
})

const formattedDate = computed(() => {
	const formattedDate = secret.value.expires.getFullYear() + '-'
      + `${secret.value.expires.getMonth() + 1}`.padStart(2, '0') + '-'
      + `${secret.value.expires.getDate()}`.padStart(2, '0')
	if ($debugsecrets) { console.debug('date: ', formattedDate, secret.value.expires) }
	return formattedDate
})

const daysToDeletion = computed(() => {
	if (!secret.value.expires) { return 999 }
	const deletionDate = new Date(secret.value.expires.toISOString())
	deletionDate.setDate(deletionDate.getDate() + 7)
	const today = new Date()
	today.setHours(0)
	today.setMinutes(0)
	today.setSeconds(0)
	today.setMilliseconds(0)
	return Math.floor((deletionDate - today) / 86400000)
})

const copyButtonIcon = computed(() => {
	if (copyState.value === 'success') { return 'icon-checkmark' }
	if (copyState.value === 'error') { return 'icon-error' }
	return 'icon-clippy'
})

async function copyToClipboard(url) {
	try {
		await navigator.clipboard.writeText(url)
		copyState.value = 'success'
		setTimeout(() => { copyState.value = 'ready' }, 3000)
	} catch (e) {
		showError(e.message)
		console.error(e)
		copyState.value = 'error'
		setTimeout(() => { copyState.value = 'ready' }, 3000)
	}
}

watch(
	() => secret.value ? secret.value.key : undefined,
	async (val) => {
		if (val) {
			keyBuf.value = await window.crypto.subtle.exportKey('raw', val)
		}
	},
	{
		immediate: true,
	},
)

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
			<p v-if="secret.encrypted" class="expires-container">
				<label for="expires">{{ t('secrets', 'Expires on:') }}</label>
				<input v-if="secret.expires"
					:value="formattedDate"
					type="date"
					name="expires"
					disabled="disabled">
				<input v-else
					type="text"
					name="expires"
					disabled="disabled"
					value="never">
			</p>
			<NcCheckboxRadioSwitch :checked="secret.pwHash !== null" :disabled="true">
				{{ t('secrets', 'password protected') }}
			</NcCheckboxRadioSwitch>
			<p v-if="url" class="url-container">
				<label for="url">{{ t('secrets', 'Share Link:') }}</label>
				<input type="text"
					name="url"
					disabled="disabled"
					:value="url"
					:size="url.length"
					class="url-field">
				<NcActions class="secret-actions">
					<NcActionButton :icon="copyButtonIcon"
						:aria-label="t('secrets', 'Copy Secret Link')"
						@click="copyToClipboard(url)" />
				</NcActions>
			</p>
		</div>
		<textarea v-if="secret._decrypted"
			:value="secret._decrypted"
			disabled="disabled" />

		<div v-else-if="!secret.encrypted" id="emptycontent">
			<div class="icon-toggle" />
			<h2>{{ t('secrets', 'This secret has already been retrieved and its content was consequently deleted from the server.') }}</h2>
		</div>
		<div v-else id="emptycontent">
			<div class="icon-password" />
			<h2>{{ t('secrets', 'Could not decrypt secret (key not available locally).') }}</h2>
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

	input.url-field {
		width: 100%;
	}
</style>
