/**
 * SPDX-FileCopyrightText: 2018 John Molakvoæ <skjnldsv@protonmail.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createApp } from 'vue'
import CryptoLib from './crypto.js'
import PublicApp from './Public.vue'

const debug = document.getElementById('secrets-root').getAttribute('data-debugsecrets') === 'true'

const app = createApp(PublicApp)
app.provide('cryptolib', new CryptoLib(window.crypto, window, debug))
app.provide('debugsecrets', debug)
app.mount('#secrets-root')
