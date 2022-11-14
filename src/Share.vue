<template>
	<!--
	SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
	SPDX-License-Identifier: AGPL-3.0-or-later
	-->
	<div id="content" class="app-secrets">
		<AppContent class="centered">
			<h2>The following secret has been shared with you securely:</h2>
			<!--v-on:secret-changed="changeSecret"-->
			<NoteCard type="warning">
				<p>
				Please make sure you have copied and stored the secret before closing this page! It is now deleted on the server.
				</p>
			</NoteCard>
			<Secret v-if="secret"
					v-model="secret"
					:locked="false"></Secret>
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
import Secret from "./Secret";

import '@nextcloud/dialogs/styles/toast.scss'
import { showError, showSuccess } from '@nextcloud/dialogs'


export default {
	name: 'App',
	components: {
		AppContent,
		Secret,
		NoteCard
	},
	data() {
		return {
			secret: null,
			loading: true
		}
	},
	async mounted() {
		try {
			const dataEl = document.getElementById("secret");
			const ivStr = dataEl.getAttribute("data-iv");
			const encryptedStr = dataEl.getAttribute("data-encrypted");
			const iv = this.$secrets.stringToArrayBuffer(ivStr);
			const encrypted = encryptedStr;
			console.log("to decrypt:", encryptedStr, ivStr, window.location.hash.substring(1));
			const key = await window.crypto.subtle.importKey(
						'raw',
						this.$secrets.stringToArrayBuffer(window.atob(window.location.hash.substring(1))),
						{name: this.$secrets.ALGO, iv: iv},
						false,
						['decrypt']
					);
			console.log(key);
			const decrypted = await this.$secrets.decrypt(encryptedStr,
				key,
				iv)
			this.secret = {
				title: t('secrets', 'Shared Secret'),
				iv: iv,
				encrypted: this.$secrets.stringToArrayBuffer(encrypted),
				_decrypted: decrypted
			}
			console.log("decrypted: ", decrypted);
		} catch (e) {
			console.error(e)
			showError(t('secrets', 'Could not fetch secrets'))
		}
		this.loading = false
	}
}
</script>

<style scoped>
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
</style>
