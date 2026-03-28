/**
 * SPDX-FileCopyrightText: 2018 John Molakvoæ <skjnldsv@protonmail.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { n, t } from '@nextcloud/l10n'
import { createApp } from 'vue'
import App from '@/views/App.vue'
import CryptoLib from './crypto.js'

const debug = document.getElementById('secrets-root')?.getAttribute('data-debugsecrets') === 'true'

const app = createApp(App)

app.provide('t', t)
app.provide('n', n)
app.provide('cryptolib', new CryptoLib(window.crypto, window, debug))
app.provide('debugsecrets', debug)

app.mount('#secrets-root')
