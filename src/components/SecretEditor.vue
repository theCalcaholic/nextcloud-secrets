<script setup lang="ts">
// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Secret } from '@/model'

import { t } from '@nextcloud/l10n'
import { NcDateTimePicker, NcNoteCard, NcPasswordField } from '@nextcloud/vue'

import '@nextcloud/dialogs/styles/toast.scss'

const model = defineModel<Secret | undefined>(undefined)

defineProps({
	locked: {
		type: Boolean,
		default: false,
	},
})

defineEmits(['saveSecret'])

</script>

<template>
	<div v-if="model" class="secret-container">
		<p>
			<label for="expires">{{ t('secrets', 'Expires on:') }}</label>
			<NcDateTimePicker
				v-model="model.expires"
				name="expires"
				:clearable="false"
				type="date"
				:placeholder="t('secrets', 'Expiration Date')" />
		</p>
		<NcPasswordField
			v-model="model.password"
			:label="t('secrets', 'share password (optional)')"
			:minlength="4"
			:required="false" />
		<NcNoteCard type="info">
			{{ t('secrets', 'If you set a share password, anyone opening the share link will also need to enter this password before they can view the secret.') }}
		</NcNoteCard>
		<textarea
			v-model="model._decrypted"
			:disabled="locked"
			:placeholder="t('secrets', 'Type or paste the secret you want to share (e.g. a password, CSV data, or bank account details)...')"
			:aria-label="t('secrets', 'Secret content')" />
		<input
			type="button"
			class="primary"
			:value="t('secrets', 'Save')"
			:disabled="locked"
			@click="$emit('saveSecret', model)">
	</div>
	<div v-else class="secret-container">
		{{ t('secrets', 'No secret selected') }}
	</div>
</template>

<style scoped>

	div.secret-container {
		width: 100%;
		min-height: 50%;
		padding: 20px;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	textarea {
		flex-grow: 1;
		width: 100%;
		font-family: 'Lucida Console', monospace;
	}

	:deep(.notecard) {
		margin-bottom: 12px;
	}

	.secret-actions {
		display: inline-block;
	}

	input.url-field {
		float: inline-start;
		max-width: 90%;
		width: 30em;
	}
</style>
