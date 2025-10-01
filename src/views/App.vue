<script setup>
import { NcActionButton, NcAppContent, NcAppNavigation, NcAppNavigationItem, NcAppNavigationNew } from '@nextcloud/vue'
import NcContent from '@nextcloud/vue/components/NcContent'
import Secret from '../components/Secret.vue'
import SecretEditor from '../components/SecretEditor.vue'

import '@nextcloud/dialogs/styles/toast.scss'
import { generateOcsUrl } from '@nextcloud/router'
import { showError, showSuccess } from '@nextcloud/dialogs'
import axios from '@nextcloud/axios'
import { computed, ref, onMounted, inject } from 'vue'
import Delete from 'vue-material-design-icons/Delete.vue'
import Close from 'vue-material-design-icons/Close.vue'


const secrets = ref([]);
const currentSecretUuid = ref(null);
const currentSecretKeyBuf = ref(null);
const updating = ref(false)
const loading = ref(false)

const $cryptolib = inject('cryptolib');

const currentSecret = computed({
	get: () => {
		if (currentSecretUuid.value === null) {
			return null
		}
		return secrets.value.find((secret) => secret.uuid === currentSecretUuid.value)
	},
	set: (val) => {
		const index = secrets.value.findIndex((secret) => secret.uuid === currentSecretUuid.value)
		secrets.value[index] = val;
	},
})

const locked = computed(() => {
	return updating.value || loading.value
})

onMounted(async () => {
	try {
		const response = await axios.get(generateOcsUrl('/apps/secrets/api/v1/secrets'))
		secrets.value = response.data.ocs.data.map(secret => {
			return {
				...secret,
				expires: new Date(secret.expires),
				iv: secret.iv === null ? null : $cryptolib.b64StringToArrayBuffer(secret.iv),
				_decrypted: null,
				key: null,
			}
		})
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
 */
function saveSecret() {
  if (currentSecretUuid.value !== '') { showError("Can't save existing secret") }
  createSecret(currentSecret.value)
}

/**
 * Create a new secret and focus the secret content field automatically
 * The secret is not yet saved, therefore an id of "" is used until it
 * has been persisted in the backend
 */
async function newSecret() {
  const key = await $cryptolib.generateCryptoKey()
  const iv = $cryptolib.generateIv()
  if (currentSecretUuid.value !== '') {
    currentSecretUuid.value = ''
    const expiryDate = new Date()
    expiryDate.setDate((new Date()).getDate() + 7)
    secrets.value.push({
      uuid: '',
      title: t('secrets', 'New Secret') + ' ' + (new Date()).toLocaleDateString(),
      password: '',
      pwHash: null,
      key,
      iv,
      expires: expiryDate,
      _decrypted: '',
    })
    console.debug('new secret: ', secrets.value[secrets.value.length-1])
    console.debug('current secret: ', currentSecret.value)
  }
}

/**
 * Abort creating a new secret
 */
function cancelNewSecret() {
  secrets.value.splice(secrets.value.findIndex((secret) => secret.uuid === ''), 1)
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
    console.debug("Saving secret: ", secret);
    const encryptedPromise = $cryptolib.encrypt(secret._decrypted, secret.key, secret.iv)
    const expiresStr = secret.expires.toISOString()
    const encryptedSecret = {
      title: secret.title,
      password: secret.password === '' ? null : secret.password,
      expires: expiresStr,
      encrypted: await encryptedPromise,
      iv: $cryptolib.arrayBufferToB64String(secret.iv),
    }
    const response = await axios.post(generateOcsUrl('/apps/secrets/api/v1/secrets'), encryptedSecret)
    const data = response.data.ocs.data
    const decrypted = await $cryptolib.decrypt(
        data.encrypted,
        secret.key,
        $cryptolib.b64StringToArrayBuffer(data.iv))
    const index = secrets.value.findIndex((match) => match.uuid === currentSecretUuid.value)
    secrets.value[index] = {
      ...data,
      expires: new Date(data.expires),
      _decrypted: decrypted,
      key: secret.key,
      iv: $cryptolib.b64StringToArrayBuffer(data.iv),
    };
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
    if (!secret.uuid) { throw new Error('Secret has no UUID!') }
    await axios.delete(generateOcsUrl(`/apps/secrets/api/v1/secrets/${secret.uuid}`))
    secrets.value.splice(secrets.value.indexOf(secret), 1)
    if (currentSecretUuid.value === secret.uuid) {
      currentSecretUuid.value = null
      currentSecretKeyBuf.value = null
    }
    showSuccess(t('secrets', 'Secret deleted'))
  } catch (e) {
    console.error(e)
    showError(t('secrets', 'Could not delete the secret'))
  }
}

async function updateSecretTitle(secret, title) {
  if (secret.uuid) {
    await axios.put(generateOcsUrl(`/apps/secrets/api/v1/secrets/${secret.uuid}/title`), { title })
  }
  secret.title = title
}
</script>

<template>
	<!--
    SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
    SPDX-License-Identifier: AGPL-3.0-or-later
    -->
	<NcContent app-name="secrets">
		<NcAppNavigation aria-label="Secrets List">
			<template #list>
				<NcAppNavigationNew v-if="!loading"
					:text="t('secrets', 'New secret')"
					:disabled="false"
					button-id="new-secrets-button"
					button-class="icon-add"
					@click="newSecret" />
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
					<template slot="actions">
						<NcActionButton v-if="secret.uuid === ''"
							@click="cancelNewSecret(secret)">
              <template #icon>
                <Close/>
              </template>
							{{ t('secrets', 'Cancel secret creation') }}
						</NcActionButton>
						<NcActionButton v-else
							@click="deleteSecret(secret)">
              <template #icon>
                <Delete/>
              </template>
							{{ t('secrets', 'Delete secret') }}
						</NcActionButton>
					</template>
				</NcAppNavigationItem>
			</template>
		</NcAppNavigation>
		<NcAppContent>
			<SecretEditor
          v-if="currentSecret && currentSecretUuid === ''"
          v-model:expires="currentSecret.expires"
          v-model:password="currentSecret.password"
          v-model:content="currentSecret._decrypted"
          :locked="locked"
          @save-secret="saveSecret" />
			<Secret v-else-if="currentSecret"
				:secret="currentSecret"
				:locked="locked"
				:success="t('secrets', 'Your secret is stored end-to-end encrypted on the server. ' +
					'It can only be decrypted by someone who has been given the link.\n' +
					'Once retrieved successfully, the secret will be deleted on the server')" />
			<div v-else id="emptycontent">
				<div class="icon-file" />
				<h2>{{ t('secrets', 'Create a secret to get started') }}</h2>
			</div>
		</NcAppContent>
	</NcContent>
</template>

<style module>
:global(.app-content) {
	padding: 44px 20px 20px;
}

.active .app-navigation-entry {
	background-color: var(--color-background-dark);
}

.content {
	display: flex;
	width: 100%;
	border-radius: var(--body-container-radius);
	overflow: hidden;
}

:global(#secrets-root) {
  width: 100%;
}
</style>
