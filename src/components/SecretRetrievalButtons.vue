<script setup lang="ts">
// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { showError } from '@nextcloud/dialogs'
import { t } from '@nextcloud/l10n'
import { NcFormBox, NcFormBoxButton } from '@nextcloud/vue'
import { computed, ref, toRefs } from 'vue'
import IconError from 'vue-material-design-icons/AlertOctagonOutline.vue'
import IconCheckmark from 'vue-material-design-icons/Check.vue'
import IconCopy from 'vue-material-design-icons/ContentCopy.vue'
import IconDownload from 'vue-material-design-icons/FileDownload.vue'

const props = defineProps<{
	decrypted: string
	secretFilename: string
}>()
const emit = defineEmits(['secretRetrieved'])
const { secretFilename } = toRefs(props)

type ActionState = 'ready' | 'success' | 'error'
const copyState = ref<ActionState>('ready')
const downloadState = ref<ActionState>('ready')

const copyButtonIcon = computed(() => {
	return {
		success: IconCheckmark,
		error: IconError,
		ready: IconCopy,
	}[copyState.value]
})

const downloadButtonIcon = computed(() => {
	return {
		success: IconCheckmark,
		error: IconError,
		ready: IconDownload,
	}[downloadState.value]
})

//  Copy argument value to clipboard
/**
 *
 * @param content
 */
async function copyToClipboard(content: string): Promise<void> {
	try {
		await navigator.clipboard.writeText(content)
		copyState.value = 'success'
		setTimeout(() => { copyState.value = 'ready' }, 3000)
		emit('secretRetrieved')
	} catch (e) {
		showError((e as { message: string }).message ?? (e as { toString: () => string }).toString())
		console.error(e)
		copyState.value = 'error'
		setTimeout(() => { copyState.value = 'ready' }, 3000)
	}
}

// Download given data as (text) file
/**
 *
 * @param content
 */
async function downloadAsFile(content: string): Promise<void> {
	try {
		const blob = new Blob([content], { type: 'text/plain' })
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.setAttribute('download', secretFilename.value)
		link.setAttribute('href', url)
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		emit('secretRetrieved')
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (e: any) {
		showError(e.message ?? e.toString())
		console.error(e)
		downloadState.value = 'error'
	}
	setTimeout(() => { downloadState.value = 'ready' }, 3000)
}

</script>

<template>
	<NcFormBox class="mobile-flex-1" row>
		<NcFormBoxButton
			:label="t('secrets', 'Copy to Clipboard')"
			:aria-label="t('secrets', 'Copy the secret to the clipboard')"
			@click="copyToClipboard(decrypted)">
			<template #icon>
				<component :is="copyButtonIcon" :size="20" />
			</template>
			<template #description>
				<span class="mobile-hide">
					{{ t('secrets', 'Copy the secret to the clipboard') }}
				</span>
			</template>
		</NcFormBoxButton>
		<NcFormBoxButton
			:label="t('secrets', 'Download')"
			:aria-label="t('secrets', 'Download the secret as a file')"
			@click="downloadAsFile(decrypted)">
			<template #icon>
				<component :is="downloadButtonIcon" :size="20" />
			</template>
			<template #description>
				<span class="mobile-hide">
					{{ t('secrets', 'Download the secret as a file') }}
				</span>
			</template>
		</NcFormBoxButton>
	</NcFormBox>
</template>
