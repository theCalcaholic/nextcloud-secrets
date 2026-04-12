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
use OCP\Activity\IManager as IActivityManager;

class Provider implements IProvider {
	protected L10nFactory $factory;
	protected IURLGenerator $url;
	protected SecretService $secretService;
	protected LoggerInterface $logger;
    private IActivityManager $activityManager;

	public function __construct(L10nFactory $factory, IURLGenerator $urlGenerator, SecretService $secretService, IActivityManager $activityManager, LoggerInterface $logger) {
		$this->factory = $factory;
		$this->url = $urlGenerator;
		$this->secretService = $secretService;
		$this->logger = $logger;
        $this->activityManager = $activityManager;
	}

	public function parse($language, IEvent $event, ?IEvent $previousEvent = null) {
		if ($event->getApp() != Application::APP_ID) {
			throw new UnknownActivityException('Invalid app: ' . $event->getApp());
		}
        $subjectParams = $event->getSubjectParameters();

        $secretSubjectData = [
            'type' => 'highlight',
            'id' => $subjectParams['uuid'],
            'name' => $subjectParams['title'],
        ];
		try {
			$secret = $this->secretService->findById($event->getObjectId(), $event->getAffectedUser());
            $secret_url = $this->url->linkToRoute('secrets.page.show', ['uuid' => $secret->getUuid()]);
            $secretSubjectData['link'] = $secret_url;
		} catch (SecretNotFound $e) {
            $this->logger->debug('Secret \'' . $event->getObjectId() . '\' not found when parsing activity');
		}
		$l = $this->factory->get('secrets', $language);

		$event->setIcon($this->url->getAbsoluteURL($this->url->imagePath(Application::APP_ID, 'secrets-dark.svg')));
		switch ($event->getType()) {
			case RetrievalSetting::IDENTIFIER:
				$event->setRichSubject($l->t('Secret \'{secret}\' has been retrieved'), [
					'secret' => $secretSubjectData
				]);
				break;
			case ExpirySetting::IDENTIFIER:
				$event->setRichSubject($l->t('Secret \'{secret}\' has expired without being retrieved'), [
					'secret' => $secretSubjectData
				]);
				break;
            case CreateSetting::IDENTIFIER:
                if ($event->getAuthor() == $this->activityManager->getCurrentUserId()) {
                    $msg = 'You created secret \'{secret}\'';
                } else {
                    $msg = 'Secret \'{secret}\' has been created';
                }
                $event->setRichSubject($l->t($msg), [
                    'secret' => $secretSubjectData
                ]);
                break;
            default:
                throw new UnknownActivityException('Unknown activity type: ' . $event->getType());
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
