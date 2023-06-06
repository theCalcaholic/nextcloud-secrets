<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Controller;

use OCA\Secrets\AppInfo\Application;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\IConfig;
use OCP\IRequest;
use OCP\IUserSession;
use OCP\Notification\IManager;
use OCP\Util;

class PageController extends Controller {
	private IManager $notificationManager;
	private ?string $userId;
	private bool $debug;

	public function __construct(IRequest $request, IManager $notificationManager, IUserSession $userSession, IConfig $config) {
		parent::__construct(Application::APP_ID, $request);
		$this->notificationManager = $notificationManager;
		$this->userId = $userSession->getUser()->getUID();
		$this->debug = $config->getSystemValueBool("debug");
	}

	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 */
	public function index(): TemplateResponse {
		Util::addScript(Application::APP_ID, 'secrets-main');

		return new TemplateResponse(Application::APP_ID, 'main', ["debug" => $this->debug]);
	}

	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 */
	public function show(string $uuid): TemplateResponse {
		$notification = $this->notificationManager->createNotification();
		$notification->setApp('secrets')
			->setUser($this->userId)
			->setObject('secret_retrieved', $uuid);
		$this->notificationManager->markProcessed($notification);
		return $this->index();
	}
}
