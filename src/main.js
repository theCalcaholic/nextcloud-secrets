/**
 * SPDX-FileCopyrightText: 2018 John Molakvoæ <skjnldsv@protonmail.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import CryptoLib from './crypto.js'
import { createApp } from 'vue'
import { t, n } from '@nextcloud/l10n'
import App from './App.vue'

const debug = document.getElementById('secrets-root')
	.getAttribute('data-debugsecrets') === 'true'

const app = createApp(App)

app.provide('t', t)
app.provide('n', n)
app.provide('cryptolib', new CryptoLib(window.crypto, window, debug))
app.provide('debugsecrets', debug)

const rootEl = document.getElementById('secrets-root')
// rootEl.style.display = 'flex'
// rootEl.style.flexGrow = '1'
// rootEl.style.flexDirection = 'column'
// rootEl.style.alignContent = 'space-between'
app.mount(rootEl)
