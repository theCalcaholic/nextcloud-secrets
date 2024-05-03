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
