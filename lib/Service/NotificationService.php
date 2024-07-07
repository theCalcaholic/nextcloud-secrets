<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Service;

use DateTime;
use Exception;

use OCA\Secrets\AppInfo\Application;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Db\MultipleObjectsReturnedException;

use OCA\Secrets\Db\Secret;
use OCA\Secrets\Db\SecretMapper;
use OCP\ILogger;
use OCP\IURLGenerator;
use OCP\Notification\IManager as INotificationManager;
use Psr\Log\LoggerInterface;

class NotificationService
{
	private INotificationManager $notificationManager;
	private IURLGenerator $urlGenerator;
	private ILogger $logger;

	public function __construct(
		INotificationManager $notificationManager,
		IURLGenerator        $urlGenerator,
		ILogger              $logger)
	{
		$this->notificationManager = $notificationManager;
		$this->urlGenerator = $urlGenerator;
		$this->logger = $logger;
	}

	/**
	 * @param Secret $secret
	 * @return void
	 */
	public function notifyRetrieved(Secret $secret)
	{
		$notification = $this->notificationManager->createNotification();
		error_log("Creating new notification for " . $secret->getUserId() . ".");
		try {
			$notification->setApp(Application::APP_ID)
				->setObject("secret_retrieved", $secret->getUuid())
				->setUser($secret->getUserId())
				->setDateTime(new DateTime())
				->setSubject(Application::APP_ID, ['secret' => $secret->getUuid()]);
			$this->notificationManager->notify($notification);
		} catch (\Exception $e) {
			$this->logger->logException($e, ['app' => Application::APP_ID]);
		}

	}
}
