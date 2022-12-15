<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\AppInfo;

use OCP\AppFramework\App;

class Application extends App {
	public const APP_ID = 'secrets';

	public function __construct() {
		parent::__construct(self::APP_ID);
	}
}
