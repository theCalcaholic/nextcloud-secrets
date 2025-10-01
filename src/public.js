/**
 * SPDX-FileCopyrightText: 2018 John Molakvoæ <skjnldsv@protonmail.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Crypto } from '@peculiar/webcrypto'

import CryptoLib from './crypto.js'
import Share from './views/Share.vue'
import {createApp} from "vue";

const crypto = new Crypto()
const debug = document.getElementById('secrets-root').getAttribute('data-debugsecrets') === 'true'

const app = createApp(Share);
app.config.globalProperties.t = window.t;
app.config.globalProperties.n = window.n;
app.provide('cryptolib', new CryptoLib(crypto, window, debug))
app.provide('debugsecrets', debug);
app.mount("#secrets-root")
