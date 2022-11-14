<template>
	<div class="secret-container">
		<textarea v-model="value" :disabled="locked" />
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
		AppNavigationNew
	},
	props: ['locked', 'title'],
	data() {
		return {
			value: ''
		};
	},
	computed: {
	},
	methods: {
	}
}
</script>

<style scoped>

	div.secret-container {
		width: 100%;
		height: 100%;
		padding: 20px;
		display: flex;
		flex-direction: column;
		flex-grow: 1;
	}

	input.secret-title[type='text'] {
		width: 100%;
		margin-top: 2.2em !important;
	}
	textarea {
		flex-grow: 1;
		width: 100%;
	}

	textarea.warning {
		color: var(--color-warning);
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
