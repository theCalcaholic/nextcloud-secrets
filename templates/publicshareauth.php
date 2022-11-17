<?php
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: GPL-3.0-or-later
/** @var array $_ */
/** @var \OCP\IL10N $l */
\OCP\Util::addStyle('core', 'guest');
\OCP\Util::addStyle('core', 'publicshareauth');
\OCP\Util::addScript('secrets', 'publicshareauth');
?>

<div class="guest-box">
	<!-- password prompt form. It should be hidden when we show the email prompt form -->
	<?php if (!isset($_['identityOk'])): ?>
	<form method="post" id="password-input-form">
	<?php else: ?>
	<form method="post" id="password-input-form" style="display:none;">
	<?php endif; ?>
		<fieldset class="warning">
			<?php if (!isset($_['wrongpw'])): ?>
				<div class="warning-info"><?php p($l->t('This share is password-protected')); ?></div>
			<?php endif; ?>
			<?php if (isset($_['wrongpw'])): ?>
				<div class="warning wrongPasswordMsg"><?php p($l->t('The password is wrong or expired. Please try again.')); ?></div>
			<?php endif; ?>
			<p>
				<label for="password" class="infield"><?php p($l->t('Password')); ?></label>
				<input type="hidden" name="requesttoken" value="<?php p($_['requesttoken']) ?>" />
				<input type="password" name="password" id="password"
					   placeholder="<?php p($l->t('Password')); ?>" value=""
					   autocomplete="new-password" autocapitalize="off" autocorrect="off"
					   autofocus />
				<input type="submit" id="password-submit"
					   class="svg icon-confirm input-button-inline" value="" disabled="disabled" />
			</p>
		</fieldset>
	</form>

</div>

