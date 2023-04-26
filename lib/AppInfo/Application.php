<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\AppInfo;

use OCA\Secrets\Notification\Notifier;
use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;
use OCP\Notification\IManager;

class Application extends App implements IBootstrap {
	public const APP_ID = 'secrets';

	public function __construct() {
		parent::__construct(self::APP_ID);
	}

	/**
	 * @param IRegistrationContext $context
	 *
	 * @since 20.0.0
	 */
	public function register(IRegistrationContext $context): void
	{ }

	/**
	 * Boot the application
	 *
	 * At this stage you can assume that all services are registered and the DI
	 * container(s) are ready to be queried.
	 *
	 * This is also the state where an optional `appinfo/app.php` was loaded.
	 *
	 * @param IBootContext $context
	 *
	 * @since 20.0.0
	 */
	public function boot(IBootContext $context): void
	{
		$notificationManager = $this->getContainer()->getServer()->getNotificationManager();
		$notificationManager->registerNotifierService(Notifier::class);
	}
}
