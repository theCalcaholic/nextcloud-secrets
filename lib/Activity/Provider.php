<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Activity;

use OCA\Secrets\AppInfo\Application;
use OCA\Secrets\Service\SecretNotFound;
use OCA\Secrets\Service\SecretService;
use OCP\Activity\Exceptions\InvalidValueException;
use OCP\Activity\Exceptions\UnknownActivityException;
use OCP\Activity\IEvent;
use OCP\Activity\IProvider;
use OCP\IURLGenerator;
use OCP\L10N\IFactory as L10nFactory;
use Psr\Log\LoggerInterface;

class Provider implements IProvider {
	protected L10nFactory $factory;
	protected IURLGenerator $url;
	protected SecretService $secretService;
	protected LoggerInterface $logger;

	public function __construct(L10nFactory $factory, IURLGenerator $urlGenerator, SecretService $secretService, LoggerInterface $logger) {
		$this->factory = $factory;
		$this->url = $urlGenerator;
		$this->secretService = $secretService;
		$this->logger = $logger;
	}

	public function parse($language, IEvent $event, ?IEvent $previousEvent = null) {
		if ($event->getApp() != Application::APP_ID || !in_array($event->getType(), ['secret_retrieval', 'secret_expiry'])) {
			throw new UnknownActivityException('Invalid app: ' . $event->getApp());
		}
		try {
			$secret = $this->secretService->findById($event->getObjectId(), $event->getAffectedUser());
		} catch (SecretNotFound $e) {
			$this->logger->error('Could not find secret for creating notification: ' . $e->getMessage(), ['exception' => $e]);
			throw new InvalidValueException('Could not find secret for creating notification: ' . $e->getMessage());
		}
		$l = $this->factory->get('secrets', $language);
		$event->setIcon($this->url->getAbsoluteURL($this->url->imagePath(Application::APP_ID, 'secrets-dark.svg')));
		$secret_url = $this->url->linkToRoute('secrets.page.show', ['uuid' => $secret->getUuid()]);
		$this->logger->warning('activity type: ' . $event->getType());
		switch ($event->getType()) {
			case 'secret_retrieval':
				$event->setRichSubject($l->t('Secret \'{secret}\' has been retrieved'), [
					'secret' => [
						'type' => 'highlight',
						'id' => $secret->getUuid(),
						'name' => $secret->getTitle(),
						'link' => $secret_url
					]
				]);
				break;
			case 'secret_expiry':
				$event->setRichSubject($l->t('Secret \'{secret}\' has expired without being retrieved'), [
					'secret' => [
						'type' => 'highlight',
						'id' => $secret->getUuid(),
						'name' => $secret->getTitle(),
						'link' => $secret_url
					]
				]);
				break;
		}
		$this->setParsedSubjectFromRichSubject($event);
		return $event;
	}

	protected function setParsedSubjectFromRichSubject(Ievent $event) {
		$placeholders = $replacements = [];
		foreach ($event->getRichSubjectParameters() as $placeholder => $parameter) {
			$placeholders[] = '{' . $placeholder . '}';
			if ($parameter['type'] === 'file') {
				$replacements[] = $parameter['path'];
			} else {
				$replacements[] = $parameter['name'];
			}
		}
		$event->setParsedSubject(str_replace($placeholders, $replacements, $event->getRichSubject()));
	}
}
