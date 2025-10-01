<script setup>
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later
import {defineProps, defineModel} from "vue";
import {NcDateTimePicker, NcPasswordField} from "@nextcloud/vue";

const props = defineProps({
  locked: Boolean,
  title: String,
});
const expires = defineModel('expires');
const password = defineModel('password');
const content = defineModel('content');
</script>

<template>
	<div class="secret-container">
		<p>
			<label for="expires">{{ t('secrets', 'Expires on:') }}</label>
			<NcDateTimePicker
        v-model="expires"
				name="expires"
				:clearable="false"
				type="date"
				:placeholder="t('secrets', 'Expiration Date')" />
		</p>
		<NcPasswordField :label="t('secrets', 'share password (optional)')"
			v-model="password"
			:minlength="4"
			:required="false" />
		<textarea v-model="content" :disabled="locked" />
		<input type="button"
			class="primary"
			:value="t('secrets', 'Save')"
			:disabled="locked"
			@click="$emit('save-secret', value)">
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
<style>
	actions.secret-actions li {
		list-style: none;
	}
</style>
