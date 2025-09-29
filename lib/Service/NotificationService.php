<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Service;

use DateTime;

use OCA\Secrets\AppInfo\Application;

use OCA\Secrets\Db\Secret;
use OCP\IURLGenerator;
use OCP\Notification\IManager as INotificationManager;
use Psr\Log\LoggerInterface;

class NotificationService {
	private INotificationManager $notificationManager;
	private IURLGenerator $urlGenerator;
	private LoggerInterface $logger;

	public function __construct(
		INotificationManager $notificationManager,
		IURLGenerator        $urlGenerator,
		LoggerInterface      $logger) {
		$this->notificationManager = $notificationManager;
		$this->urlGenerator = $urlGenerator;
		$this->logger = $logger;
	}

	/**
	 * @param Secret $secret
	 * @return void
	 */
	public function notifyRetrieved(Secret $secret) {
		$notification = $this->notificationManager->createNotification();
		try {
			$notification->setApp(Application::APP_ID)
				->setObject("secret_retrieved", $secret->getUuid())
				->setUser($secret->getUserId())
				->setDateTime(new DateTime())
				->setSubject(Application::APP_ID, ['secret' => $secret->getUuid()]);
			$this->notificationManager->notify($notification);
		} catch (\Exception $e) {
			$this->logger->error('Failed to create notification for secret retrieval: ' . $e->getMessage(), ['exception' => $e]);
		}

	}
}
