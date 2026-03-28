<?php
declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later
\OCP\Util::addStyle('secrets', 'secrets-public');
?>
<!--<div class="guest-box" style="display: flex; flex-grow: 1; flex-direction: row">-->
<div id="secrets-root" data-debugsecrets="<?php echo(isset($_['debug']) && $_['debug'] ? 'true' : 'false')?>" class="display: block; heigth: 100%;"></div>
