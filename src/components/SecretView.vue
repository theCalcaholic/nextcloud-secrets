<script setup lang="ts">
// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

import type CryptoLib from '@shared/crypto.ts'
import type { Secret } from '@/model'

import { n, t } from '@nextcloud/l10n'
import { generateUrl } from '@nextcloud/router'
import { NcFormGroup, NcNoteCard, NcTextArea } from '@nextcloud/vue'
import { computed, inject, ref, watch } from 'vue'
import SecretInfoBox from '@/components/SecretInfoBox.vue'

import '@nextcloud/dialogs/styles/toast.scss'

const model = defineModel<Secret | undefined>(undefined)
defineProps<Props>()
const cryptolib: CryptoLib = inject('cryptolib')!
const debug: boolean = inject('debugsecrets') ?? false

interface Props {
	warning?: string
	success?: string
}

const keyBuf = ref<ArrayBuffer | null>(null)

const isDecrypted = computed(() => !!model.value?.key)

const url = computed(() => {
	if (debug) {
		console.debug(`decrypted? ${isDecrypted.value}, keyBuf: ${keyBuf.value}`)
	}
	if (!isDecrypted.value || !keyBuf.value || !model.value) {
		return null
	}
	const keyStr = cryptolib.arrayBufferToB64String(new Uint8Array(keyBuf.value))
	if (debug) {
		console.debug('serialized key: ', keyStr)
	}
	return window.location.protocol + '//' + window.location.host + generateUrl(`/apps/secrets/share/${model.value.uuid}#${keyStr}`)
})

const daysToDeletion = computed(() => {
	if (!model.value?.expires) {
		return 999
	}
	const deletionDate = new Date(model.value.expires.toISOString())
	deletionDate.setDate(deletionDate.getDate() + 7)
	const today = new Date()
	today.setHours(0)
	today.setMinutes(0)
	today.setSeconds(0)
	today.setMilliseconds(0)
	return Math.floor(+deletionDate - +today / 86_400_000)
})

watch(model, async (val) => {
	if (val?.key) {
		keyBuf.value = await window.crypto.subtle.exportKey('raw', val.key)
	}
}, {
	immediate: true,
})
</script>

<template>
	<div class="secret-container">
		<NcFormGroup :label="model?.title || 'Secret'">
			<NcNoteCard v-if="success" type="success">
				<p>{{ success }}</p>
			</NcNoteCard>
			<NcNoteCard v-if="warning" type="warning">
				<p>{{ warning }}</p>
			</NcNoteCard>
			<NcNoteCard v-if="daysToDeletion <= 7" type="warning">
				<p>{{ n('secrets', 'Will be deleted in %n day', 'Will be deleted in %n days', daysToDeletion) }}</p>
			</NcNoteCard>
			<SecretInfoBox :secret="model" :url="url" wrapperClass="mobile" />
			<SecretInfoBox :secret="model" :url="url" row />
			<!-- TODO: Reduce code duplication -->
		</NcFormGroup>
		<NcTextArea
			v-if="model?._decrypted"
			class="secret-content"
			:label="t('secrets', 'Secret content')"
			:modelValue="model._decrypted ?? ''"
			:disabled="true" />
		<div v-else-if="!model?.encrypted" id="emptycontent">
			<template v-if="model?.isExpired">
				<div class="icon-delete" />
				<h5>
					{{ t('secrets', 'This secret has expired and its content was consequently deleted from the server.') }}
				</h5>
			</template>
			<template v-else>
				<div class="icon-toggle" />
				<h5>
					{{
						t('secrets', 'This secret has already been retrieved and its content was consequently deleted from the server.')
					}}
				</h5>
			</template>
		</div>
		<div v-else id="emptycontent">
			<div class="icon-password" />
			<h5>{{ t('secrets', 'Could not decrypt secret (key not available locally).') }}</h5>
		</div>
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
  gap: var(--form-group-content-gap)
}

#emptycontent > .icon-delete {
  background-image: var(--icon-delete-dark);
}

.secret-wrapper {
  height: 100%;
}

</style>
