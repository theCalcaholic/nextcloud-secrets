<template>
	<!--
	SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
	SPDX-License-Identifier: AGPL-3.0-or-later
	-->
	<div class="dialog-container">
		<h3>{{ t('secrets', 'Share Link') }}</h3>
		<ActionButton icon="icon-close">
			Close
		</ActionButton>
		<input type="text" disabled="disabled" :value="url">
		<ActionButton :icon="copyButtonIcon"
			@click="copyToClipboard(url)">
			Copy Secret Link
		</ActionButton>
	</div>
</template>

<script>
import ActionButton from '@nextcloud/vue/dist/Components/ActionButton'
import { showError } from '@nextcloud/dialogs'
export default {
	name: 'LinkShareDialog',
	components: { ActionButton },
	props: ['url'],
	data() {
		return {
			copyState: 'ready',
		}
	},
	computed: {
		copyButtonIcon() {
			if (this.copyState === 'success') { return 'icon-checkmark' }
			if (this.copyState === 'error') { return 'icon-error' }
			return 'icon-copy'
		},
		copyButtonColor() {

		},
	},
	methods: {
		async copyToClipboard(url) {
			try {
				await navigator.clipboard.writeText(url)
				this.copyButtonIcon = 'icon-success'
			} catch (e) {
				showError(e.message)
				console.error(e)
			}

		},
	},
}
</script>
