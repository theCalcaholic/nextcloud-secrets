document.addEventListener('DOMContentLoaded', function() {
	// Enables password submit button only when user has typed something in the password field
	const passwordInput = document.getElementById('password');
	const passwordButton = document.getElementById('password-submit');
	let eventListener = function () {
		passwordButton.disabled = passwordInput.value.length === 0;
	};
	passwordInput.addEventListener('click', eventListener);
	passwordInput.addEventListener('keyup', eventListener);
	passwordInput.addEventListener('change', eventListener);
});
