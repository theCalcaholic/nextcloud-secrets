<script setup lang="ts">
// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Secret } from '@/model'

import { t } from '@nextcloud/l10n'
import { NcButton, NcDateTimePicker, NcPasswordField, NcTextArea } from '@nextcloud/vue'

import '@nextcloud/dialogs/styles/toast.scss'

const model = defineModel<Secret>()

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
		<p class="expires-container">
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
			:label="t('secrets', 'access password (optional)')"
			:helperText="t('secrets', 'If you set an access password, anyone opening the share link will also need to enter this password before they can view the secret.')"
			:minlength="4"
			:required="false" />
		<NcTextArea
			class="secret-content"
			:modelValue="model._decrypted ?? ''"
			:disabled="locked"
			:label="t('secrets', 'Secret content')"
			:placeholder="t('secrets', 'Type or paste the secret you want to share (e.g. a password, CSV data, or bank account details)…')"
			:aria-label="t('secrets', 'Secret content')"
			@update:modelValue="(val) => { if (model) { model._decrypted = val } }" />
		<NcButton
			type="button"
			variant="primary"
			wide
			:disabled="locked"
			@click="$emit('saveSecret', model)">
			{{ t('secrets', 'Save') }}
		</NcButton>
	</div>
	<div v-else class="secret-container">
		{{ t('secrets', 'No secret selected') }}
	</div>
</template>

<style scoped>

	div.secret-container {
		width: 100%;
		min-height: 50%;
		padding: 44px 20px 20px 20px;
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow-x: hidden;
		box-sizing: border-box;
	}
</style>
