<template>
	<!--
	SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
	SPDX-License-Identifier: AGPL-3.0-or-later
	-->
	<div id="content" class="app-secrets">
		<AppContent class="centered">
			<h2>The following secret has been shared with you securely:</h2>
			<!--v-on:secret-changed="changeSecret"-->
			<div class="secret-container">
				<div>
					<NoteCard type="warning">
						<p>{{ t('secrets', 'Please make sure you have copied and stored the secret ' +
							'before closing this page! It is now deleted on the server.') }}</p>
					</NoteCard>
				</div>
				<Actions class="secret-actions">
					<ActionButton
						:icon="copyButtonIcon"
						@click="copyToClipboard(decrypted)" :title="t('secrets', 'Copy to Clipboard')">
					</ActionButton>
				</Actions>
				<textarea v-if="decrypted"
						  v-model="decrypted" disabled="disabled" />
			</div>
			<div v-else-if="loading" id="emptycontent">
				<div class="icon-loading" />
				<h2>{{ t('secrets', 'Retrieving secret...') }}</h2>
			</div>
			<div v-else id="emptycontent">
				<div class="icon-password" />
				<h2>{{ t('secrets', 'Error loading secret. Is your link correct?') }}</h2>
			</div>
		</AppContent>
	</div>
</template>

<script>
import AppContent from '@nextcloud/vue/dist/Components/NcAppContent'
import NoteCard from "@nextcloud/vue/dist/Components/NcNoteCard";
import ActionButton from '@nextcloud/vue/dist/Components/NcActionButton'
import Secret from "./Secret";

import '@nextcloud/dialogs/styles/toast.scss'
import { showError, showSuccess } from '@nextcloud/dialogs'


export default {
	name: 'App',
	components: {
		AppContent,
		ActionButton,
		Secret,
		NoteCard
	},
	data() {
		return {
			decrypted: null,
			loading: true,
			copyState: 'ready'
		}
	},
	computed: {

		copyButtonIcon() {
			if (this.copyState === 'success')
				return 'icon-checkmark';
			if (this.copyState === 'error')
				return 'icon-error';
			return 'icon-clippy';
		},
	},
	methods: {

		async copyToClipboard(content) {
			try {
				await navigator.clipboard.writeText(content);
				this.copyState = 'success';
				setTimeout(() => this.copyState = 'ready', 3000);
			} catch (e) {
				showError(e.message);
				console.error(e);
				this.copyState = 'error';
				setTimeout(() => this.copyState = 'ready', 3000);
			}

		}
	},
	async mounted() {
		try {
			const dataEl = document.getElementById("secret");
			const ivStr = dataEl.getAttribute("data-iv");
			const encryptedStr = dataEl.getAttribute("data-encrypted");
			const iv = this.$secrets.stringToArrayBuffer(ivStr);
			console.log("to decrypt:", encryptedStr, ivStr, window.location.hash.substring(1));
			const key = await window.crypto.subtle.importKey(
						'raw',
						this.$secrets.stringToArrayBuffer(window.atob(window.location.hash.substring(1))),
						{name: this.$secrets.ALGO, iv: iv},
						false,
						['decrypt']
					);
			console.log(key);
			this.decrypted = await this.$secrets.decrypt(encryptedStr,
				key,
				iv)
		} catch (e) {
			console.error(e)
			showError(t('secrets', 'Could not decrypt secret'))
		}
		this.loading = false
	}
}
</script>

<style scoped>
	div.secret-container {
		width: 100%;
		min-height: 50%;
		padding: 20px;
		display: flex;
		flex-direction: column;
		flex-grow: 1;
	}

	.centered {
		text-align: center;
		margin-left: auto;
		margin-right: auto;
	}
	textarea {
		width: 400px;
		height: 400px;
		margin: 2em;
		min-width: calc(100% - 4em);
	}
	input[type="button"] {
		display: block;
		margin: auto;
	}

	textarea {
		flex-grow: 1;
		width: 100%;
		margin: 0;
	}
	#content {
		width: 100%;
	}
</style>
<style>
	.app-content {
		padding: 44px 20px 20px;
	}
</style>
