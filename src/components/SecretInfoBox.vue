<script setup lang="ts">
// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Secret } from '@/model'

import { t } from '@nextcloud/l10n'
const props = defineProps<{
	secret: Secret | undefined
	url: string | null
	row?: boolean
	wrapperClass?: string
}>()

import { NcCheckboxRadioSwitch, NcFormBox, NcFormBoxCopyButton, NcTextField } from '@nextcloud/vue'
import { type Ref } from 'vue'
import { computed, toRef } from 'vue'

const secret = toRef(props, 'secret') as Ref<Secret | undefined>
const isPasswordProtected = computed(() => secret.value?.pwHash !== undefined)
</script>

<template>
	<NcFormBox
		v-slot="{itemClass}"
		class="secret-info-box"
		:class="wrapperClass ?? ''"
		:row="row ?? false">
		<fieldset class="secret-settings-container" :class="itemClass">
			<NcTextField
				v-if="secret?.encrypted && secret?.expires"
				class="expiry-field"
				inputClass="formBoxInput"
				:disabled="true"
				:label="t('secrets', 'Expires on:')"
				:modelValue="secret?.expires ? (secret.expires.toLocaleDateString() + ' ' + secret.expires.toLocaleTimeString()) : t('secrets', 'never')" />
			<NcCheckboxRadioSwitch
				v-if="secret?.encrypted"
				:modelValue="isPasswordProtected"
				:disabled="true">
				{{ isPasswordProtected ? t('secrets', 'has access password') : t('secrets', 'no access password') }}
			</NcCheckboxRadioSwitch>
		</fieldset>
		<NcFormBoxCopyButton
			v-if="url"
			class="copyButton"
			:label="t('secrets', 'Share Link:')"
			:value="url" />
	</NcFormBox>
</template>

<style scoped>

.secret-settings-container {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;

  flex-basis: 30%;
  flex-grow: 1;
  flex-shrink: 1;

  border-color: var(--color-primary-element-light);
  border-width: 2px;
  border-style: solid;
  padding: 4px;
  background-color: var(--color-primary-element-text-dark);
}

.copyButton {
  flex-basis: 70%;
}
</style>
