<template>
	<div class="secret-container">
		<input ref="title"
			   class="secret-title"
			   v-model="value.title"
			   type="text"
			   :disabled="!isUnlocked || locked || readonly">
		<p v-if="!readonly">{{ formattedUUID }}</p>
		<a v-if="!readonly && url" :href="url">Share Link</a>
		<textarea :class="isUnlocked ? '' : 'warning'"
				  v-model="value._decrypted" :disabled="!isUnlocked || locked || readonly" />
		<input v-if="!readonly" type="button"
			   class="primary"
			   :value="t('secrets', 'Save')"
			   :disabled="locked || !isUnlocked"
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
		AppNavigationNew,
	},
	data() {
		return {
			keyBuf: null,
		}
	},
	props: ['value', 'locked', 'readonly'],
	computed: {
		isUnlocked() {
			return this.value.key;
		},

		url() {
			if (!this.isUnlocked || !this.keyBuf)
				return null;
			return generateUrl(
				`/apps/secrets/secrets/show/${this.value.uuid}`
				+ `#${window.btoa(String.fromCharCode(...new Uint8Array(this.keyBuf)))}`
			);
		},
		formattedUUID() {
			if (this.value.uuid === "")
				return null;
			let uuid = this.value.uuid
			return `${uuid.substring(0, 8)}-${uuid.substring(8, 4)}-${uuid.substring(12, 4)}-${uuid.substring(16, 4)}`
				+ `-${uuid.substring(20, 12)}`;
		},

	},
	methods: {
		// async encryptSecret(secret, key) {
		// 	let encoder = new TextEncoder();
		// 	const iv = window.crypto.getRandomValues(new Uint16Array(12));
		// 	const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv },
		// 		key,
		// 		encoder.encode(secret.content)
		// 	);
		//
		// 	return {
		// 		uuid: secret.uuid,
		// 		title: secret.title,
		// 		encrypted: String.fromCharCode.apply(null, new Uint16Array(encrypted)),
		// 		iv: String.fromCharCode.apply(null, iv)
		// 	}
		// },
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
		// b64encode(bytes) {
		// 	let binary = "";
		// 	const len = bytes.byteLength;
		// 	for (let i =0; i < len; i++) {
		// 		binary += String.fromCharCode(bytes[i]);
		// 	}
		// 	return window.btoa(binary);
		// },
		// b64decode(str) {
		// 	let bString = window.atob(str);
		// 	let len = bString.length;
		// 	let buf = new Uint8Array(len);
		// 	for (let i = 0; i < len; i++) {
		// 		buf[i] = bString.charCodeAt(i);
		// 	}
		// 	return buf;
		// },
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
		// async decryptSecret(secret, key) {
		// 	const iv = this.stringToArrayBuffer(secret.iv);
		// 	const encrypted = this.stringToArrayBuffer(secret.encrypted);
		// 	const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, encrypted);
		// 	let decoder = new TextDecoder();
		//
		// 	return {
		// 		uuid: secret.uuid,
		// 		title: secret.title,
		// 		key: key,
		// 		iv: secret.iv,
		// 		content: decoder.decode(decrypted),
		// 		encrypted: secret.encrypted
		// 	};
		// },

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
		color: #ff9955;
	}
</style>
