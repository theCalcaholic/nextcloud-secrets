/**
 * SPDX-FileCopyrightText: 2018 John Molakvoæ <skjnldsv@protonmail.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import CryptoLib from './crypto'
import { createApp } from 'vue'
import App from './views/App.vue'

const debug = document.getElementById('secrets-root')
	.getAttribute('data-debugsecrets') === 'true'

const app = createApp(App)
app.config.globalProperties.t = window.t
app.config.globalProperties.n = window.n
app.provide('cryptolib', new CryptoLib(window.crypto, window, debug))
app.provide('debugsecrets', debug)
app.mount('#secrets-root')
