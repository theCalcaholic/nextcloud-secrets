<script setup>
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NcDateTimePicker, NcPasswordField } from '@nextcloud/vue'
import '@nextcloud/dialogs/styles/toast.scss'
import { t } from '@nextcloud/l10n'

import { defineProps, defineModel, ref, watch } from 'vue'

defineProps({
	locked: {
		type: Boolean,
		default: false,
	},
	title: {
		type: String,
		default: '',
	},
})
const model = defineModel({
	type: Object,
	default: () => ({
		expires: new Date(),
		password: '',
		_decrypted: '',
	}),
})

const password = ref(model.value.password)

watch(password, (pw) => {
	model.value = { ...model.value, password: pw }
})

defineEmits(['saveSecret'])

</script>

<template>
	<div class="secret-container">
		<p>
			<label for="expires">{{ t('secrets', 'Expires on:') }}</label>
			<NcDateTimePicker v-model="model.expires"
				name="expires"
				:clearable="false"
				type="date"
				:placeholder="t('secrets', 'Expiration Date')" />
		</p>
		<NcPasswordField v-model="password"
			:label="t('secrets', 'share password (optional)')"
			:minlength="4"
			:required="false" />
		<textarea v-model="model._decrypted" :disabled="locked" />
		<input type="button"
			class="primary"
			:value="t('secrets', 'Save')"
			:disabled="locked"
			@click="$emit('saveSecret', model)">
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

	.secret-actions {
		display: inline-block;
	}

	input.url-field {
		float: left;
		max-width: 90%;
		width: 30em;
	}
</style>
