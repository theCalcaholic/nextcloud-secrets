<template>
	<div class="secret-container">
		<input ref="title"
			   class="secret-title"
			   v-model="value.title"
			   type="text"
			   :disabled="!isDecrypted || locked || !isEditable">
		<div v-if="!isEditable && isDecrypted && value.encrypted">
			<p class="info">
				Your secret is stored end-to-end encrypted on the server. It can only be decrypted by someone who has been given the link.
				Once retrieved successfully, the secret will be deleted on the server
			</p>
			<input type="text" disabled="disabled" :value="url" class="url-field"/>
			<Actions class="secret-actions">
				<ActionButton
					:icon="copyButtonIcon"
					@click="copyToClipboard(url)" ariaLabel="Copy Secret Link">
				</ActionButton>
			</Actions>
		</div>
		<textarea :class="isDecrypted ? '' : 'warning'"
				  v-model="value._decrypted" :disabled="!isDecrypted || locked || !isEditable" />
		<input v-if="isEditable" type="button"
			   class="primary"
			   :value="t('secrets', 'Save')"
			   :disabled="locked || !isDecrypted"
			   @click="$emit('save-secret', value)">
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
	name: 'Secret',
	components: {
		ActionButton,
		AppContent,
		AppNavigation,
		AppNavigationItem,
		AppNavigationNew
	},
	data() {
		return {
			keyBuf: null,
			copyState: 'ready'
		}
	},
	props: ['value', 'locked'],
	computed: {
		isDecrypted() {
			return !!this.value.key;
		},
		isEditable() {
			return !this.value.uuid;
		},
		url() {
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
	methods: {
		async encryptString(s, key, iv) {
			if (s === "")
				return "";
			const encoder = new TextEncoder()
			const encrypted = await window.crypto.subtle.encrypt(
				{ name: "AES-GCM", iv: new Uint8Array(Array.from(iv).map(ch => ch.charCodeAt(0))) },
				key,
				encoder.encode(s)
			);
			console.log('encrypted', encrypted);
			const decoder = new TextDecoder();
			return decoder.decode(encrypted);
		},
		stringToArrayBuffer(str) {
			const buff = new ArrayBuffer(str.length * 2)
			const buffView = new Uint16Array(buff)
			for(let i = 0, strLen = str.length; i < strLen; i++) {
				buffView[i] = str.charCodeAt(i);
			}
			return buff;
		},
		async decryptString(s, key, iv) {
			console.log("decrypt(", s, key, iv, ")");
			if (s === "")
				return "";
			const encoder = new TextEncoder();
			console.log(encoder.encode(iv));
			console.log(encoder.encode(s));
			const decrypted = await window.crypto.subtle.decrypt(
				{name: "AES-GCM", iv: new Uint8Array(Array.from(iv).map(ch => ch.charCodeAt(0)))},
				key,
				encoder.encode(s)
			)
			const decoder = new TextDecoder();
			return decoder.decode(decrypted);


		},
		async copyToClipboard(url) {
			try {
				await navigator.clipboard.writeText(url);
				this.copyButtonIcon = 'icon-success'
			} catch (e) {
				showError(e.message);
				console.error(e);
			}

		}

	}
}
</script>

<style scoped>

	div.secret-container {
		width: 100%;
		height: 100%;
		padding: 20px;
		display: flex;
		flex-direction: column;
		flex-grow: 1;
	}

	input.secret-title[type='text'] {
		width: 100%;
		margin-top: 2.2em !important;
	}
	textarea {
		flex-grow: 1;
		width: 100%;
	}

	textarea.warning {
		color: var(--color-warning);
	}

	.secret-actions {
		display: inline-block;
	}

	input.url-field {
		float: left;
		max-width: 90%;
		width: 30em;
	}
</style>
<style>
	actions.secret-actions li {
		list-style: none;
	}
</style>
