/**
 * SPDX-FileCopyrightText: 2018 John Molakvoæ <skjnldsv@protonmail.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { generateFilePath } from '@nextcloud/router'

import lib from './common';
import Vue from 'vue'
Object.defineProperty(Vue.prototype, "$secrets", {value: lib})
import App from './App'
import Share from './Share'

// eslint-disable-next-line
__webpack_public_path__ = generateFilePath(appName, '', 'js/')

Vue.mixin({ methods: { t, n } })

let app;
if (window.location.pathname.indexOf("/apps/secrets/show/") === -1)
	app = App;
else
	app = Share;

export default new Vue({
	el: '#secret-root',
	render: h => h(app),
});
