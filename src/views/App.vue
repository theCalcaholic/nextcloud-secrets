<script setup lang="ts">
// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

import type CryptoLib from '@shared/crypto.ts'

import { showError, showSuccess } from '@nextcloud/dialogs'
import { t } from '@nextcloud/l10n'
import { NcActionButton, NcAppContent, NcAppNavigation, NcAppNavigationCaption, NcAppNavigationItem, NcContent } from '@nextcloud/vue'
import { createClient } from '@shared/api/client'
import { secretApiCreateSecret, secretApiDelete, secretApiGetAll, secretApiUpdateTitle } from '@shared/api/sdk.gen.ts'
import { ocsHeaders } from '@shared/model'
import { computed, inject, onMounted, ref, watch } from 'vue'
import IconEye from 'vue-material-design-icons/EyeOutline.vue'
import IconFileDocumentPlus from 'vue-material-design-icons/FileDocumentPlusOutline.vue'
import IconLockOpen from 'vue-material-design-icons/LockOpen.vue'
import IconLock from 'vue-material-design-icons/LockOutline.vue'
import IconPlus from 'vue-material-design-icons/Plus.vue'
import IconTrashCan from 'vue-material-design-icons/TrashCanOutline.vue'
import SecretEditor from '@/components/SecretEditor.vue'
import SecretView from '@/components/SecretView.vue'
import { createClientConfig } from '@/api-client.ts'
import { type Secret } from '@/model'

const client = createClient(createClientConfig())

import '@nextcloud/dialogs/styles/toast.scss'

const cryptolib: CryptoLib = inject('cryptolib')!

const secrets = ref<Secret[]>([])
const currentSecretUuid = ref<string | undefined>(undefined)
const currentSecretKeyBuf = ref<BufferSource | undefined>(undefined)
const updating = ref<boolean>(false)
const loading = ref<boolean>(true)

const currentSecret = computed({
	get() {
		if (currentSecretUuid.value === null) {
			return null
		}
		return secrets.value.find((secret: Secret) => secret.uuid === currentSecretUuid.value)
	},
	set(val: Secret) {
		currentSecretUuid.value = secrets.value.find((secret: Secret) => (secret.uuid === val.uuid))!.uuid
	},
})

const locked = computed(() => updating.value || loading.value)

const isSecureContext = window.isSecureContext

/**
 * Fetch list of secrets when the component is loaded
 */
onMounted(async () => {
	try {
		const response = await secretApiGetAll({ ...ocsHeaders, client })
		if (!response.data || response.error) {
			console.error(response)
			showError(t('secrets', 'Could not fetch secrets') + `: ${response.error}`)
			loading.value = false
			return
		}
		secrets.value = response.data.ocs.data.map((secret) => ({
			...secret,
			pwHash: secret.pwHash === '' ? null : undefined,
			expires: new Date(secret.expires),
			iv: secret.iv === null ? null : cryptolib.b64StringToArrayBuffer(secret.iv),
			_decrypted: null,
			key: null,
			password: '',
		} as Secret))
		const secretUuidPos = window.location.pathname.indexOf('/s/')
		if (secretUuidPos !== -1) {
			currentSecretUuid.value = window.location.pathname.substring(secretUuidPos + 3)
		}
	} catch (e) {
		console.error(e)
		showError(t('secrets', 'Could not fetch secrets'))
	}
	loading.value = false
})

/**
 * Create a new secret and focus the secret content field automatically
 *
 * @param secret Secret object
 */
function openSecret(secret: Secret) {
	if (updating.value) {
		return
	}
	currentSecretUuid.value = secret.uuid
}

/**
 * Action tiggered when clicking the save button
 * create a new secret or save
 *
 * @param secret Secret object
 */
function saveSecret(secret: Secret) {
	if (currentSecretUuid.value !== '') {
		showError(t('secrets', 'Can\'t save already existing secret'))
	}
	createSecret(secret)
}

/**
 * Create a new secret and focus the secret content field automatically
 * The secret is not yet saved, therefore an id of "" is used until it
 * has been persisted in the backend
 */
async function newSecret() {
	const key = await cryptolib.generateCryptoKey()
	const iv = cryptolib.generateIv()
	if (currentSecretUuid.value !== '') {
		currentSecretUuid.value = ''
		const expiryDate = new Date()
		expiryDate.setDate((new Date()).getDate() + 7)
		secrets.value.push({
			uuid: '',
			title: t('secrets', 'Secret from {date} {time}', {
				date: (new Date()).toLocaleDateString(),
				time: (new Date()).toLocaleTimeString(),
			}),
			password: '',
			pwHash: undefined,
			key,
			iv,
			expires: expiryDate,
			_decrypted: '',
			encrypted: null,
			isExpired: false,
		})
	}
}

/**
 * Abort creating a new secret
 */
function cancelNewSecret() {
	secrets.value = secrets.value.filter((secret: Secret) => secret.uuid !== '')
	currentSecretUuid.value = undefined
}

/**
 * Create a new secret by sending the information to the server
 *
 * @param secret Secret object
 */
async function createSecret(secret: Secret) {
	if (!secret._decrypted) {
		console.error('Cannot create secret: _decrypted value is undefined')
		return
	}
	if (!secret.key) {
		console.error('Cannot create secret: crypto key is undefined')
		return
	}
	updating.value = true
	try {
		const encryptedPromise = cryptolib.encrypt(secret._decrypted, secret.key, secret.iv)
		const expiresDate = new Date(secret.expires.getTime())
		expiresDate.setHours(0, 0, 0, 0)
		const expiresStr = expiresDate.toISOString()
		const encryptedSecret = {
			title: secret.title,
			password: secret.password === '' ? null : secret.password,
			expires: expiresStr,
			encrypted: await encryptedPromise,
			iv: cryptolib.arrayBufferToB64String(secret.iv),
		}
		const response = await secretApiCreateSecret({ ...ocsHeaders, client, body: encryptedSecret })
		if (!response.data || response.error) {
			console.log(response.error)
			showError(t('secrets', 'Could not create the secret') + `: ${response.error}`)
			return
		}
		const data = response.data.ocs.data
		const decrypted = await cryptolib.decrypt(
			data.encrypted,
			secret.key,
			cryptolib.b64StringToArrayBuffer(data.iv),
		)
		secrets.value = secrets.value.map((sec: Secret) => {
			if (sec.uuid === currentSecretUuid.value) {
				return {
					...data,
					expires: new Date(data.expires),
					_decrypted: decrypted,
					key: sec.key,
					iv: cryptolib.b64StringToArrayBuffer(data.iv),
					pwHash: secret.password ? '' : undefined,
				} as Secret
			}
			return sec
		})
		currentSecretUuid.value = data.uuid
		currentSecretKeyBuf.value = await window.crypto.subtle.exportKey('raw', secret.key)
	} catch (e) {
		console.error(e)
		showError(t('secrets', 'Could not create the secret'))
	}
	updating.value = false
}

/**
 * Delete a secret, remove it from the frontend and show a hint
 *
 * @param secret Secret object
 */
async function deleteSecret(secret: Secret) {
	try {
		if (!secret.uuid) {
			throw new Error('Cannot delete: Secret has no UUID!')
		}
		const response = await secretApiDelete({
			...ocsHeaders,
			client,
			path: { uuid: secret.uuid! },
		})
		if (response.error) {
			showError(t('secrets', 'Could not delete the secret') + `: ${response.error}`)
			return
		}
		secrets.value = secrets.value.filter((match: Secret) => match.uuid !== secret.uuid)
		if (currentSecretUuid.value === secret.uuid) {
			currentSecretUuid.value = undefined
			currentSecretKeyBuf.value = undefined
		}
		showSuccess(t('secrets', 'Secret deleted'))
	} catch (e) {
		console.error(e)
		showError(t('secrets', 'Could not delete the secret'))
	}
}

/**
 *
 * @param secret
 * @param title
 */
async function updateSecretTitle(secret: Secret, title: string) {
	if (secret.uuid) {
		await secretApiUpdateTitle({
			...ocsHeaders,
			client,
			path: { uuid: secret.uuid },
			body: { title },
		})
	}
	secret.title = title
}

watch(currentSecret, (newSecret) => {
	console.log('secret update', newSecret)
})

</script>

<template>
	<NcContent v-if="isSecureContext" appName="secrets">
		<NcAppNavigation :aria-label="t('secrets', 'Navigation')">
			<template #list>
				<NcAppNavigationCaption :name="t('secrets', 'Secrets')">
					<template #actions>
						<NcActionButton @click="newSecret">
							<template #icon>
								<IconPlus :size="20" />
							</template>
							{{ t('secrets', 'New secret') }}
						</NcActionButton>
					</template>
				</NcAppNavigationCaption>
				<NcAppNavigationItem
					v-for="secret in secrets"
					:key="secret.uuid"
					:name="secret.title"
					:class="{
						active: currentSecretUuid === secret.uuid,
						invalidated: secret.encrypted === null,
					}"
					:editable="true"
					:editLabel="t('secrets', 'Change Title')"
					@update:name="(name) => updateSecretTitle(secret, name)"
					@click="openSecret(secret)">
					<template #icon>
						<IconFileDocumentPlus v-if="secret.uuid === ''" :size="20" />
						<IconTrashCan v-else-if="secret.isExpired" :size="20" />
						<IconEye v-else-if="secret.encrypted === null" :size="20" />
						<IconLockOpen v-else-if="secret._decrypted" :size="20" />
						<IconLock v-else :size="20" />
					</template>
					<template #actions>
						<NcActionButton
							v-if="secret.uuid === ''"
							icon="icon-close"
							@click="cancelNewSecret()">
							{{
								t('secrets', 'Cancel secret creation')
							}}
						</NcActionButton>
						<NcActionButton
							v-else
							icon="icon-delete"
							@click="deleteSecret(secret)">
							{{
								t('secrets', 'Delete secret')
							}}
						</NcActionButton>
					</template>
				</NcAppNavigationItem>
			</template>
		</NcAppNavigation>
		<NcAppContent>
			<SecretEditor
				v-if="currentSecret && currentSecretUuid === ''"
				v-model="currentSecret"
				:locked="locked"
				@saveSecret="saveSecret" />
			<SecretView
				v-else-if="currentSecret"
				v-model="currentSecret"
				:locked="locked"
				:success="t('secrets', 'Your secret is stored end-to-end encrypted on the server. It can only be decrypted by someone who has been given the link. Once retrieved successfully, the secret will be deleted on the server')" />
			<div v-else id="emptycontent">
				<div class="icon-file" />
				<h2>{{ t('secrets', 'Create a secret to get started') }}</h2>
			</div>
		</NcAppContent>
	</NcContent>
	<NcContent v-else appName="secrets">
		<NcAppContent>
			<div id="emptycontent">
				<div class="icon-alert-outline" />
				<h2>{{ t('secrets', 'Secrets is only available when visiting Nextcloud at an encrypted (https) address.') }}</h2>
			</div>
		</NcAppContent>
	</NcContent>
</template>

<!--.active .app-navigation-entry {-->
<!--  background-color: var(&#45;&#45;color-background-dark);-->
<!--}-->

<style>
#secrets-root .app-navigation-entry-link>.app-navigation-entry-icon.icon-delete {
  background-image: var(--icon-delete-dark);
  opacity: .5;
}

.secret-content.textarea {
  flex-grow: 1;
  width: 100%;
  font-family: 'Lucida Console', monospace;
  margin-top: calc(4 * var(--default-grid-baseline));
}

.secret-content.textarea *:not(label) {
  height: 100%;
}

.formBoxInput {
  color: var(--color-primary-element-light-text) !important;
}
.formBoxInput, .formBoxInput label {
  background-color: var(--color-primary-element-light-hover) !important;
}

.secret-info-box {
  display: none;
}
.secret-info-box.mobile {
  display: flex;
}

@media only screen and (min-width: 1024px) {
  .secret-info-box {
    display: flex !important;
  }
  .secret-info-box.mobile {
    display: none !important;
  }
}
</style>
