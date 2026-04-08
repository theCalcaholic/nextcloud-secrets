<?php
declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later
\OCP\Util::addStyle('secrets', 'secrets-style');
?>
<!--<div class="guest-box" style="display: flex; flex-grow: 1; flex-direction: row">-->
<div id="secrets-root" data-debugsecrets="<?php echo(isset($_['debug']) && $_['debug'] ? 'true' : 'false')?>" class="display: block; heigth: 100%;"></div>
