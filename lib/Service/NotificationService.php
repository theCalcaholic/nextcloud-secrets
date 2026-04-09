<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Service;

use DateTime;
use OCA\Secrets\Activity\CreateSetting;
use OCA\Secrets\Activity\ExpirySetting;
use OCA\Secrets\Activity\RetrievalSetting;
use OCA\Secrets\AppInfo\Application;

use OCA\Secrets\Db\Secret;
use OCP\Activity\IManager as IActivityManager;
use OCP\IURLGenerator;
use OCP\Notification\IManager as INotificationManager;
use Psr\Log\LoggerInterface;

class NotificationService {
	private INotificationManager $notificationManager;
	private IURLGenerator $urlGenerator;
	private IActivityManager $activityManager;
	private LoggerInterface $logger;

	public function __construct(
		INotificationManager $notificationManager,
		IURLGenerator $urlGenerator,
		LoggerInterface $logger,
		IActivityManager $activityManager,
	) {
		$this->logger = $logger;
		$this->activityManager = $activityManager;
		$this->notificationManager = $notificationManager;
		$this->urlGenerator = $urlGenerator;
	}

	/**
	 * @param Secret $secret
	 * @return void
	 */
	public function notifyRetrieved(Secret $secret): void {
		$this->createRetrievalNotification($secret);
		$this->createRetrievalActivity($secret);
	}

	/**
	 * @param Secret $secret
	 * @return void
	 */
	public function notifyExpired(Secret $secret): void {
		$this->createExpiryNotification($secret);
		$this->createExpiryActivity($secret);
	}

    public function notifyCreated(Secret $secret): void {
        $this->createCreationActivity($secret);
    }

	private function createRetrievalNotification(Secret $secret): void {
		$notification = $this->notificationManager->createNotification();
		try {
			$notification->setApp(Application::APP_ID)
				->setObject('secret', $secret->getUuid())
				->setUser($secret->getUserId())
				->setDateTime(new DateTime())
				->setSubject('secret_retrieval', ['secret' => $secret->getUuid()]);
			$this->notificationManager->notify($notification);
		} catch (\Exception $e) {
			$this->logger->error('Failed to create notification for secret retrieval: ' . $e->getMessage(), ['exception' => $e]);
		}
	}

	private function createExpiryNotification(Secret $secret): void {
		$notification = $this->notificationManager->createNotification();
		try {
			$notification->setApp(Application::APP_ID)
				->setObject('secret', $secret->getUuid())
				->setUser($secret->getUserId())
				->setDateTime(new DateTime())
				->setSubject('secret_expiry', ['secret' => $secret->getUuid()]);
			$this->notificationManager->notify($notification);
		} catch (\Exception $e) {
			$this->logger->error('Failed to create notification for secret expiry: ' . $e->getMessage(), ['exception' => $e]);
		}
	}

    private function createCreationActivity(Secret $secret): void {
        $event = $this->activityManager->generateEvent();
        $event->setApp(Application::APP_ID);
        $event->setType(CreateSetting::IDENTIFIER);
        $event->setAffectedUser($secret->getUserId());
        $event->setSubject('secret_creation');//, ['uuid' => $secret->getUuid(), 'title' => $secret->getTitle()]);
        $event->setObject('secret', $secret->getId(), $secret->getTitle());
        $this->activityManager->publish($event);
    }
	private function createRetrievalActivity(Secret $secret): void {
		$event = $this->activityManager->generateEvent();
		$event->setApp(Application::APP_ID);
		$event->setType(RetrievalSetting::IDENTIFIER);
		$event->setAffectedUser($secret->getUserId());
		$event->setSubject('secret_retrieval');//, ['uuid' => $secret->getUuid(), 'title' => $secret->getTitle()]);
		$event->setObject('secret', $secret->getId(), $secret->getTitle());
		$this->activityManager->publish($event);
	}

	private function createExpiryActivity(Secret $secret): void {
		$event = $this->activityManager->generateEvent();
		$event->setApp(Application::APP_ID);
		$event->setType(ExpirySetting::IDENTIFIER);
		$event->setAffectedUser($secret->getUserId());
		$event->setSubject('secret_expiry');
		$event->setObject('secret', $secret->getId(), $secret->getTitle());
		$this->activityManager->publish($event);
	}
}
