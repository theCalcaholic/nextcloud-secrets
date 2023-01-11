<template>
	<!--
	SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
	SPDX-License-Identifier: AGPL-3.0-or-later
	-->
	<div class="secret-container">
		<p>
			<label for="expires">Expires on:</label>
			<DatetimePicker name="expires" :clearable="false" v-model="value.expires" type="date"
							placeholder="Expiration Date"/>
		</p>
		<PasswordField label="share password (optional)"
					   :value.sync="value.password"
					   :minlength="4" :required="false"/>
		<textarea v-model="value._decrypted" :disabled="locked" />
		<input type="button"
			   class="primary"
			   :value="t('secrets', 'Save')"
			   :disabled="locked"
			   @click="$emit('save-secret', value)">
	</div>
</template>

<script>
import ActionButton from '@nextcloud/vue/dist/Components/NcActionButton'
import AppContent from '@nextcloud/vue/dist/Components/NcAppContent'
import AppNavigation from '@nextcloud/vue/dist/Components/NcAppNavigation'
import AppNavigationItem from '@nextcloud/vue/dist/Components/NcAppNavigationItem'
import AppNavigationNew from '@nextcloud/vue/dist/Components/NcAppNavigationNew'
import DatetimePicker from '@nextcloud/vue/dist/Components/NcDatetimePicker';
import PasswordField from '@nextcloud/vue/dist/Components/NcPasswordField';

import '@nextcloud/dialogs/styles/toast.scss'
import { generateUrl } from '@nextcloud/router'
import { showError, showSuccess } from '@nextcloud/dialogs'
import axios from '@nextcloud/axios'

export default {
	name: 'Secret',
	components: {
		ActionButton,
		AppContent,
		AppNavigation,
		AppNavigationItem,
		AppNavigationNew,
		DatetimePicker,
		PasswordField
	},
	props: ['locked', 'title', 'value'],
	computed: {
	},
	methods: {
	}
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
