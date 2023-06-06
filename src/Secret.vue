<template>
	<!--
	SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
	SPDX-License-Identifier: AGPL-3.0-or-later
	-->
	<div class="secret-container">
		<div>
			<NoteCard v-if="success" type="success">
				<p>{{ success }}</p>
			</NoteCard>
			<NoteCard v-if="warning" type="warning">
				<p>{{ warning }}</p>
			</NoteCard>
			<NoteCard v-if="daysToDeletion <= 7" type="warning">
				<p>{{ n('secrets', 'Will be deleted in %n day', 'Will be deleted in %n days', daysToDeletion) }}</p>
			</NoteCard>
			<p v-if="value.encrypted" class="expires-container">
				<label for="expires">Expires on:</label>
				<input v-if="value.expires"
					v-model="formattedDate"
					type="date"
					name="expires"
					disabled="disabled">
				<input v-else
					type="text"
					name="expires"
					disabled="disabled"
					value="never">
			</p>
			<CheckboxRadioSwitch :checked="value.pwHash !== null" :disabled="true">
				password protected
			</CheckboxRadioSwitch>
			<p v-if="url" class="url-container">
				<label for="url">Share Link:</label>
				<input type="text"
					name="url"
					disabled="disabled"
					:value="url"
					:size="url.length"
					class="url-field">
				<Actions class="secret-actions">
					<ActionButton :icon="copyButtonIcon"
						aria-label="Copy Secret Link"
						@click="copyToClipboard(url)" />
				</Actions>
			</p>
		</div>
		<textarea v-if="secret._decrypted"
			v-model="secret._decrypted"
			disabled="disabled" />

		<div v-else-if="!value.encrypted" id="emptycontent">
			<div class="icon-toggle" />
			<h2>{{ t('secrets', 'This secret has already been retrieved and its content was consequently deleted from the server.') }}</h2>
		</div>
		<div v-else id="emptycontent">
			<div class="icon-password" />
			<h2>{{ t('secrets', 'Could not decrypt secret (key not available locally).') }}</h2>
		</div>
	</div>
</template>

<script>
import ActionButton from '@nextcloud/vue/dist/Components/NcActionButton.js'
import Actions from '@nextcloud/vue/dist/Components/NcActions.js'
import NoteCard from '@nextcloud/vue/dist/Components/NcNoteCard.js'
import CheckboxRadioSwitch from '@nextcloud/vue/dist/Components/NcCheckboxRadioSwitch.js'

import '@nextcloud/dialogs/styles/toast.scss'
import { generateUrl } from '@nextcloud/router'
import { showError } from '@nextcloud/dialogs'

export default {
	name: 'Secret',
	components: {
		ActionButton,
		Actions,
		CheckboxRadioSwitch,
		NoteCard,
	},
	props: {
		value: {
			type: Object,
			default: () => {},
		},
		locked: {
			type: String,
			default: '',
		},
		warning: {
			type: String,
			default: '',
		},
		success: {
			type: String,
			default: '',
		},
	},
	data() {
		return {
			keyBuf: null,
			copyState: 'ready',
			secret: this.value,
		}
	},
	computed: {
		isDecrypted() {
			return !!this.value.key
		},
		isEditable() {
			return !this.value.uuid
		},
		url() {
			if (this.$debugsecrets)
				console.debug(`decrypted? ${this.isDecrypted}, keyBuf: ${this.keyBuf}`)
			if (!this.isDecrypted || !this.keyBuf) { return null }
			const keyStr = this.$cryptolib.arrayBufferToB64String(new Uint8Array(this.keyBuf))
			if (this.$debugsecrets)
				console.debug("serialized key: ", keyStr)
			return window.location.protocol + '//' + window.location.host + generateUrl(
				`/apps/secrets/show/${this.value.uuid}`
				+ `#${keyStr}`
			)
		},
		formattedUUID() {
			if (this.value.uuid === "") { return null }
			let uuid = this.value.uuid
			return `${uuid.substring(0, 8)}-${uuid.substring(8, 4)}-${uuid.substring(12, 4)}`
				+ `-${uuid.substring(16, 4)}-${uuid.substring(20, 12)}`
		},
		// expiryDate() {
		// 	console.log('expires', this.value.expires);
		// 	// let timeIndex = this.value.expires.indexOf('T');
		// 	// if (timeIndex === -1)
		// 	return Date.parse(this.value.expires);
		// 	// return new Date(this.value.expires.substring(0, timeIndex));
		// },
		formattedDate() {
			const formattedDate = this.value.expires.getFullYear() + '-'
				+ `${this.value.expires.getMonth()+1}`.padStart(2, '0') + '-'
				+ `${this.value.expires.getDate()}`.padStart(2, '0')
			if (this.$debugsecrets)
				console.debug("date: ", formattedDate, this.value.expires)
			//return this.value.expires.toISOString().substring(0, 10);
			return formattedDate;
		},
		daysToDeletion() {
			if (!this.value.expires) { return 999 }
			let deletionDate = new Date(this.value.expires.toISOString())
			deletionDate.setDate(deletionDate.getDate() + 7)
			let today = new Date()
			today.setHours(0)
			today.setMinutes(0)
			today.setSeconds(0)
			today.setMilliseconds(0)
			return Math.floor((deletionDate - today) / 86400000)
		},
		copyButtonIcon() {
			if (this.copyState === 'success') { return 'icon-checkmark' }
			if (this.copyState === 'error') { return 'icon-error' }
			return 'icon-clippy'
		},

	},
	watch: {
		async value() {
			if (this.value.key) { this.keyBuf = await window.crypto.subtle.exportKey('raw', this.value.key) }
		},
	},
	async mounted() {
		if (this.value.key) { this.keyBuf = await window.crypto.subtle.exportKey('raw', this.value.key) }
	},
	methods: {
		async copyToClipboard(url) {
			try {
				await navigator.clipboard.writeText(url)
				this.copyState = 'success'
				setTimeout(() => { this.copyState = 'ready' }, 3000)
			} catch (e) {
				showError(e.message)
				console.error(e)
				this.copyState = 'error'
				setTimeout(() => { this.copyState = 'ready' }, 3000)
			}

		},

	},
}
</script>

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
<style>
	actions.secret-actions li {
		list-style: none;
	}
</style>
