<template>
	<AppContent>
		<textarea disabled="disabled" v-model="decrypted">
		</textarea>
	</AppContent>
</template>

<script>

import AppContent from "@nextcloud/vue/dist/Components/AppContent";
import axios from "@nextcloud/axios";
import {generateUrl} from "@nextcloud/router";
import {showError} from "@nextcloud/dialogs";
console.log("loading...");
export default {
	name: 'Share',
	components: {
		AppContent
	},
	data() {
		return {
			decrypted: null,
			loading: true,
			secret: null
		}
	},
	computed: {},
	async mounted() {
		try {
			const uuidIndex = window.location.pathname.lastIndexOf('/');
			const uuid = window.location.pathname.substring(uuidIndex);
			console.log("retrieving ", generateUrl(`/apps/secrets/api/show/${uuid}`));
			const response = await axios.get(generateUrl(`/apps/secrets/api/show/${uuid}`))
			this.secret = response.data;
			this.decrypted = await this.$secrets.decrypt(this.secret.encrypted, window.location.hash, this.secret.iv);
			console.log(this.decrypted);
		} catch (e) {
			console.error(e)
			showError(t('secrets', 'Could not fetch secret'))
		}
		this.loading = false
	}
}
</script>
