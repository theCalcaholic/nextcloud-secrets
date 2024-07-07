// SPDX-FileCopyrightText: Nextcloud Contributors
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * redirect to new URL
 */
function redirect() {
	console.log(`old url: ${document.URL}\nnew url: ${document.URL.replace('/show/', '/share/')}`)
	const newUrl = document.URL.replace('/show/', '/share/')
	document.getElementById('redirectLink').href = newUrl
	window.location.href = newUrl
}

document.addEventListener('DOMContentLoaded', redirect)
