<template>
	<!--
	SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
	SPDX-License-Identifier: AGPL-3.0-or-later
	-->
	<div class="secret-container">
		<p>
			<label for="expires">{{ t('secrets', 'Expires on:') }}</label>
			<NcDateTimePicker v-model="value.expires"
				name="expires"
				:clearable="false"
				type="date"
				:placeholder="t('secrets', 'Expiration Date')" />
		</p>
		<NcPasswordField :label="t('secrets', 'share password (optional)')"
		    :value="value.password"
			:value.sync="value.password"
			:minlength="4"
			:required="false" />
		<textarea v-model="value._decrypted" :disabled="locked" />
		<input type="button"
			class="primary"
			:value="t('secrets', 'Save')"
			:disabled="locked"
			@click="$emit('save-secret', value)">
	</div>
</template>

<script>
import {NcDateTimePicker, NcPasswordField} from '@nextcloud/vue'

import '@nextcloud/dialogs/styles/toast.scss'

export default {
	name: 'SecretEditor',
	components: {
		NcDateTimePicker,
		NcPasswordField,
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
			type: Object,
			default: () => ({
				expires: new Date(),
				password: '',
				_decrypted: '',
			}),
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
<style>
	actions.secret-actions li {
		list-style: none;
	}
</style>
