<script setup>
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NcActionButton } from '@nextcloud/vue'
import { showError } from '@nextcloud/dialogs'
import { ref, defineProps, computed } from 'vue'
import { t } from '@nextcloud/l10n'

defineProps({
	url: {
		type: String,
		default: '',
	},
})
const copyState = ref('ready')

const copyButtonIcon = computed(() => {
	return {
		success: 'icon-checkmark',
		error: 'icon-error',
		ready: 'icon-copy',
	}
})

// TODO: Keep only one implementation of 'copyToClipboard'
/**
 *
 * @param url
 */
async function copyToClipboard(url) {
	try {
		await navigator.clipboard.writeText(url)
		copyState.value = 'success'
		setTimeout(() => { copyState.value = 'ready' }, 3000)
	} catch (e) {
		showError(e.message)
		console.error(e)
	}
}

</script>

<template>
	<div class="dialog-container">
		<h3>{{ t('secrets', 'Share Link') }}</h3>
		<NcActionButton icon="icon-close">
			Close
		</NcActionButton>
		<input type="text" disabled :value="url">
		<NcActionButton :icon="copyButtonIcon"
			@click="copyToClipboard(url)">
			Copy Secret Link
		</NcActionButton>
	</div>
</template>
