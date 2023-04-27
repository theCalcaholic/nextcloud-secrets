<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Notification;

use Exception;
use InvalidArgumentException;
use OCA\Secrets\AppInfo\Application;
use OCA\Secrets\Service\SecretService;
use OCP\ILogger;
use OCP\IURLGenerator;
use OCP\L10N\IFactory;
use OCP\Notification\AlreadyProcessedException;
use OCP\Notification\INotification;
use OCP\Notification\INotifier;

class Notifier implements INotifier {
	protected IFactory $factory;
	protected IURLGenerator $url;
	protected SecretService $secretService;
	protected ILogger $logger;

	public function __construct(IFactory $factory, IURLGenerator $urlGenerator, SecretService $secretService, ILogger $logger) {
		$this->factory = $factory;
		$this->url = $urlGenerator;
		$this->secretService = $secretService;
		$this->logger = $logger;
	}

	/**
	 * Identifier of the notifier, only use [a-z0-9_]
	 *
	 * @return string
	 * @since 17.0.0
	 */
	public function getID(): string {
		return Application::APP_ID;
	}

	/**
	 * Human readable name describing the notifier
	 *
	 * @return string
	 * @since 17.0.0
	 */
	public function getName(): string {
		return $this->factory->get(Application::APP_ID)->t('Secrets');
	}

	/**
	 * @param INotification $notification
	 * @param string $languageCode The code of the language that should be used to prepare the notification
	 * @return INotification
	 * @throws \InvalidArgumentException When the notification was not prepared by a notifier
	 * @throws AlreadyProcessedException When the notification is not needed anymore and should be deleted
	 * @since 9.0.0
	 */
	public function prepare(INotification $notification, string $languageCode): INotification {
		if ($notification->getApp() != Application::APP_ID) {
			throw new InvalidArgumentException("Unknown app: " . $notification->getApp());
		}
		try {
			$secret = $this->secretService->find($notification->getObjectId(), $notification->getUser());
		} catch (Exception $e) {
			$this->logger->logException($e);
			throw new AlreadyProcessedException();
		}

		$l = $this->factory->get('secrets', $languageCode);
		$notification->setIcon($this->url->getAbsoluteURL($this->url->imagePath(Application::APP_ID, 'secrets-dark.svg')));
		$secret_url = $this->url->linkToRoute('secrets.page.show', ['uuid' => $secret->getUuid()]);
		$notification->setRichSubject($l->t('Secret \'{secret}\' has been retrieved'), [
			'secret' => [
				'type' => 'highlight',
				'id' => $secret->getUuid(),
				'name' => $secret->getTitle(),
				'link' => $secret_url
			]
		]);
		$this->setParsedSubjectFromRichSubject($notification);
		return $notification;
	}

	protected function setParsedSubjectFromRichSubject(INotification $notification): void {
		$placeholders = $replacements = [];
		foreach ($notification->getRichSubjectParameters() as $placeholder => $parameter) {
			$placeholders[] = '{' . $placeholder . '}';
			if ($parameter['type'] === 'file') {
				$replacements[] = $parameter['path'];
			} else {
				$replacements[] = $parameter['name'];
			}
		}

		$notification->setParsedSubject(str_replace($placeholders, $replacements, $notification->getRichSubject()));
	}
}
