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
			<NoteCard v-else type="warning"  v-if="daysToDeletion <= 7">
				<p>{{ t('secrets', 'Will be deleted in $X$ days').replace('$X$', '' + daysToDeletion) }}</p>
			</NoteCard>
			<p class="expires-container" v-if="value.encrypted">
				<label for="expires">Expires on:</label>
				<input v-if="value.expires" type="date" name="expires" v-model="formattedDate" disabled="disabled">
				<input v-else type="text" name="expires" disabled="disabled" value="never"/>
			</p>
			<CheckboxRadioSwitch :checked="value.pwHash !== null" :disabled="true">
				password protected
			</CheckboxRadioSwitch>
			<p class="url-container" v-if="url">
				<label for="url">Share Link:</label>
				<input type="text" name="url" disabled="disabled" :value="url" :size="url.length" class="url-field"/>
				<Actions class="secret-actions">
					<ActionButton
						:icon="copyButtonIcon"
						@click="copyToClipboard(url)" ariaLabel="Copy Secret Link">
					</ActionButton>
				</Actions>
			</p>
		</div>
		<textarea v-if="value._decrypted"
				  v-model="value._decrypted" disabled="disabled" />

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
import ActionButton from '@nextcloud/vue/dist/Components/NcActionButton'
import Actions from '@nextcloud/vue/dist/Components/NcActions';
import AppContent from '@nextcloud/vue/dist/Components/NcAppContent'
import AppNavigation from '@nextcloud/vue/dist/Components/NcAppNavigation'
import AppNavigationItem from '@nextcloud/vue/dist/Components/NcAppNavigationItem'
import AppNavigationNew from '@nextcloud/vue/dist/Components/NcAppNavigationNew'
import NoteCard from '@nextcloud/vue/dist/Components/NcNoteCard'
import CheckboxRadioSwitch from '@nextcloud/vue/dist/Components/NcCheckboxRadioSwitch';

import '@nextcloud/dialogs/styles/toast.scss'
import { generateUrl } from '@nextcloud/router'
import { showError, showSuccess } from '@nextcloud/dialogs'
import axios from '@nextcloud/axios'

export default {
	name: 'Secret',
	components: {
		ActionButton,
		Actions,
		AppContent,
		AppNavigation,
		AppNavigationItem,
		AppNavigationNew,
		CheckboxRadioSwitch,
		NoteCard
	},
	data() {
		return {
			keyBuf: null,
			copyState: 'ready'
		}
	},
	props: ['value', 'locked', 'warning', 'success'],
	computed: {
		isDecrypted() {
			return !!this.value.key;
		},
		isEditable() {
			return !this.value.uuid;
		},
		url() {
			console.log(`decrypted? ${this.isDecrypted}, keyBuf: ${this.keyBuf}`)
			if (!this.isDecrypted || !this.keyBuf)
				return null;
			const keyArray = Array.from(new Uint8Array(this.keyBuf));
			const keyStr = keyArray.map(byte => String.fromCharCode(byte)).join('');
			return window.location.protocol + '//' + window.location.host + generateUrl(
				`/apps/secrets/show/${this.value.uuid}`
				+ `#${window.btoa(keyStr)}`
			);
		},
		formattedUUID() {
			if (this.value.uuid === "")
				return null;
			let uuid = this.value.uuid
			return `${uuid.substring(0, 8)}-${uuid.substring(8, 4)}-${uuid.substring(12, 4)}-${uuid.substring(16, 4)}`
				+ `-${uuid.substring(20, 12)}`;
		},
		formattedDate() {
			let timeIndex = this.value.expires.indexOf('T');
			if (timeIndex === -1)
				return this.value.expires;
			return this.value.expires.substring(0, timeIndex);
		},
		daysToDeletion() {
			if (!this.value.expires)
				return 999;
			let deletionDate = new Date(this.formattedDate);
			deletionDate.setDate(deletionDate.getDate() + 7);
			let today = new Date();
			console.log(today);
			today.setHours(0);
			today.setMinutes(0);
			today.setSeconds(0);
			today.setMilliseconds(0);
			return Math.floor((deletionDate - today) / 86400000);
		},
		copyButtonIcon() {
			if (this.copyState === 'success')
				return 'icon-checkmark';
			if (this.copyState === 'error')
				return 'icon-error';
			return 'icon-clippy';
		},

	},
	watch: {
		async value() {
			if (this.value.key)
				this.keyBuf = await window.crypto.subtle.exportKey("raw", this.value.key);
		}
	},
	async mounted() {
		if (this.value.key)
			this.keyBuf = await window.crypto.subtle.exportKey("raw", this.value.key);
	},
	methods: {
		async copyToClipboard(url) {
			try {
				await navigator.clipboard.writeText(url);
				this.copyState = 'success';
				setTimeout(() => this.copyState = 'ready', 3000);
			} catch (e) {
				showError(e.message);
				console.error(e);
				this.copyState = 'error';
				setTimeout(() => this.copyState = 'ready', 3000);
			}

		}

	}
}
</script>

<style scoped>

	div.secret-container {
		width: 100%;
		min-height: 50%;
		display: flex;
		flex-direction: column;
		flex-grow: 1;
	}

	textarea {
		flex-grow: 1;
		width: 100%;
		font-family: "Lucida Console", monospace;
	}

	/*textarea.warning {*/
	/*	color: var(--color-warning);*/
	/*}*/

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
