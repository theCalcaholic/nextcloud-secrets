<script setup>
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NcContent, NcAppContent, NcActionButton, NcAppNavigationCaption, NcAppNavigation, NcAppNavigationItem } from '@nextcloud/vue'
import Secret from '@/views/Secret.vue'
import SecretEditor from '@/components/SecretEditor.vue'
import IconPlus from 'vue-material-design-icons/Plus.vue'

import '@nextcloud/dialogs/styles/toast.scss'
import { generateOcsUrl } from '@nextcloud/router'
import { showError, showSuccess } from '@nextcloud/dialogs'
import axios from '@nextcloud/axios'
import { computed, inject, onMounted, ref, watch } from 'vue'
import { t } from '@nextcloud/l10n'

const cryptolib = inject('cryptolib')

const secrets = ref([])
const currentSecretUuid = ref(null)
const currentSecretKeyBuf = ref(null)
const updating = ref(false)
const loading = ref(true)

const currentSecret = computed({
	get() {
		if (currentSecretUuid.value === null) {
			return null
		}
		return secrets.value.find((secret) => secret.uuid === currentSecretUuid.value)
	},
	set(val) {
		secrets.value = secrets.value.map((secret) => {
			if (secret.uuid === currentSecretUuid.value) {
				return val
			}
			return secret
		})
	},
})

const locked = computed(() => updating.value || loading.value)

/**
 * Fetch list of secrets when the component is loaded
 */
onMounted(async () => {
	try {
		const response = await axios.get(generateOcsUrl('/apps/secrets/api/v1/secrets'))
		secrets.value = response.data.ocs.data.map(secret => ({
			...secret,
			expires: new Date(secret.expires),
			iv: secret.iv === null ? null : cryptolib.b64StringToArrayBuffer(secret.iv),
			_decrypted: null,
			key: null,
		}))
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
 * @param {object} secret Secret object
 */
function openSecret(secret) {
	if (updating.value) {
		return
	}
	currentSecretUuid.value = secret.uuid
}

/**
 * Action tiggered when clicking the save button
 * create a new secret or save
 *
 * @param {object} secret Secret object
 */
function saveSecret(secret) {
	if (currentSecretUuid.value !== '') {
		showError(t('secrets', "Can't save already existing secret"))
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
			pwHash: null,
			key,
			iv,
			expires: expiryDate,
			_decrypted: '',
		})
	}
}

/**
 * Abort creating a new secret
 */
function cancelNewSecret() {
	secrets.value = secrets.value.filter((secret) => secret.uuid !== '')
	currentSecretUuid.value = null
}

/**
 * Create a new secret by sending the information to the server
 *
 * @param {object} secret Secret object
 */
async function createSecret(secret) {
	updating.value = true
	try {
		const encryptedPromise = cryptolib.encrypt(secret._decrypted, secret.key, secret.iv)
		const expiresStr = secret.expires.toISOString()
		const encryptedSecret = {
			title: secret.title,
			password: secret.password === '' ? null : secret.password,
			expires: expiresStr,
			encrypted: await encryptedPromise,
			iv: cryptolib.arrayBufferToB64String(secret.iv),
		}
		const response = await axios.post(generateOcsUrl('/apps/secrets/api/v1/secrets'), encryptedSecret)
		const data = response.data.ocs.data
		const decrypted = await cryptolib.decrypt(
			data.encrypted,
			secret.key,
			cryptolib.b64StringToArrayBuffer(data.iv),
		)
		secrets.value = secrets.value.map(secret => {
			if (secret.uuid === currentSecretUuid.value) {
				return {
					...data,
					expires: new Date(secret.expires),
					_decrypted: decrypted,
					key: secret.key,
					iv: cryptolib.b64StringToArrayBuffer(data.iv),
				}
			}
			return secret
		})
		currentSecretUuid.value = data.uuid
		currentSecretKeyBuf.value = await window.crypto.subtle.exportKey('raw', currentSecret.value.key)
	} catch (e) {
		console.error(e)
		showError(t('secrets', 'Could not create the secret'))
	}
	updating.value = false
}

/**
 * Delete a secret, remove it from the frontend and show a hint
 *
 * @param {object} secret Secret object
 */
async function deleteSecret(secret) {
	try {
		if (!secret.uuid) {
			throw new Error('Secret has no UUID!')
		}
		await axios.delete(generateOcsUrl(`/apps/secrets/api/v1/secrets/${secret.uuid}`))
		secrets.value = secrets.value.filter(match => match.uuid !== secret.uuid)
		if (this.currentSecretUUId === secret.uuid) {
			currentSecretUuid.value = null
			currentSecretKeyBuf.value = null
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
async function updateSecretTitle(secret, title) {
	if (secret.uuid) {
		await axios.put(generateOcsUrl(`/apps/secrets/api/v1/secrets/${secret.uuid}/title`), { title })
	}
	secret.title = title
}

watch(currentSecret, (newSecret) => {
	console.log('secret update', newSecret)
})

</script>

<template>
	<NcContent app-name="secrets">
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
				<NcAppNavigationItem v-for="secret in secrets"
					:key="secret.uuid"
					:name="secret.title"
					:class="{
						active: currentSecretUuid === secret.uuid,
						invalidated: secret.encrypted === null
					}"
					:editable="true"
					:edit-label="t('secrets', 'Change Title')"
					:icon="secret.uuid === '' ? 'icon-template-add' : (secret.encrypted === null ? 'icon-toggle' : 'icon-password')"
					@update:name="(name) => updateSecretTitle(secret, name)"
					@click="openSecret(secret)">
					<template #actions>
						<NcActionButton v-if="secret.uuid === ''"
							icon="icon-close"
							@click="cancelNewSecret()">
							{{
								t('secrets', 'Cancel secret creation')
							}}
						</NcActionButton>
						<NcActionButton v-else
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
			<SecretEditor v-if="currentSecret && currentSecretUuid === ''"
				v-model="currentSecret"
				:locked="locked"
				@save-secret="saveSecret" />
			<Secret v-else-if="currentSecret"
				v-model="currentSecret"
				:locked="locked"
				:success="t('secrets', 'Your secret is stored end-to-end encrypted on the server. ' +
					'It can only be decrypted by someone who has been given the link.' +
					'Once retrieved successfully, the secret will be deleted on the server')" />
			<div v-else id="emptycontent">
				<div class="icon-file" />
				<h2>{{ t('secrets', 'Create a secret to get started') }}</h2>
			</div>
		</NcAppContent>
	</NcContent>
</template>

<!--.active .app-navigation-entry {-->
<!--  background-color: var(&#45;&#45;color-background-dark);-->
<!--}-->
