<template>
	<!--
	SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
	SPDX-License-Identifier: AGPL-3.0-or-later
	-->
	<div class="secret-container">
		<p>
			<label for="expires">Expires on:</label>
			<DatetimePicker v-model="expires"
				name="expires"
				:clearable="false"
				type="date"
				placeholder="Expiration Date" />
		</p>
		<PasswordField label="share password (optional)"
			:value.sync="password"
			:minlength="4"
			:required="false" />
		<textarea v-model="_decrypted" :disabled="locked" />
		<input type="button"
			class="primary"
			:value="t('secrets', 'Save')"
			:disabled="locked"
			@click="$emit('save-secret', value)">
	</div>
</template>

<script>
import DatetimePicker from '@nextcloud/vue/dist/Components/NcDatetimePicker.js'
import PasswordField from '@nextcloud/vue/dist/Components/NcPasswordField.js'

import '@nextcloud/dialogs/styles/toast.scss'

export default {
	name: 'SecretEditor',
	components: {
		DatetimePicker,
		PasswordField,
	},
	props: {
		locked: {
			type: Boolean,
			default: false,
		},
		title: {
			type: String,
			default: '',
		},
		value: {
			type: String,
			default: '',
		},
	},
	computed: {
	},
	methods: {
	},
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
<style>
	actions.secret-actions li {
		list-style: none;
	}
</style>
