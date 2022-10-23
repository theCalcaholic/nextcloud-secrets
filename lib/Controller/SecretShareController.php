<?php
declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Controller;

use OCA\Secrets\AppInfo\Application;
use OCA\Secrets\Service\SecretNotFound;
use OCA\Secrets\Service\SecretService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;

use OCP\AppFramework\PublicShareController;
use OCP\ISession;
use function PHPUnit\Framework\throwException;

class SecretShareController extends PublicShareController {
	private SecretService $service;
	public function __construct(IRequest      $request,
								ISession $session,
								SecretService $service) {
		parent::__construct(Application::APP_ID, $request, $session);
		$this->service = $service;
	}
	protected function getPasswordHash(): string
	{
		throw new ErrorException("this should not be called");
	}

	public function isValidToken(): bool
	{

		try {
			error_log($this->getToken());
			$this->service->findPublic($this->getToken());
			return true;
		} catch (SecretNotFound $e) {
			return false;
		}
	}

	protected function isPasswordProtected(): bool
	{
		return false;
	}

	/**
	 * @PublicPage
	 * @NoCSRFRequired
	 */
	public function get() {
		return "hello world";
	}
}
