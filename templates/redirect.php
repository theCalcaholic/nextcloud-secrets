<?php
// SPDX-FileCopyrightText: Nextcloud Contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
/** @var array $_ */
/** @var \OCP\IL10N $l */
\OCP\Util::addStyle('core', 'guest');
?>

<div class="guest-box" style="margin: auto;">
	<!-- password prompt form. It should be hidden when we show the email prompt form -->
	<p class="info"><?php echo $l->t("This path has changed. Redirecting you to the new location. If this doesn't work, click the following link:"); ?></p>
	<a id="redirectLink" href=""><?php echo $l->t("Go to secret"); ?></a>

</div>

