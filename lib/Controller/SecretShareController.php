<?php
declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Controller;

use InvalidArgumentException;
use OCA\Secrets\AppInfo\Application;
use OCA\Secrets\Db\Secret;
use OCA\Secrets\Service\SecretNotFound;
use OCA\Secrets\Service\SecretService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\IRequest;

use OCP\AppFramework\PublicShareController;
use OCP\ISession;
use OCP\Util;
use function PHPUnit\Framework\throwException;

class SecretShareController extends PublicShareController {
	private SecretService $service;
	private Secret $secret;

	public function __construct(IRequest      $request,
								ISession $session,
								SecretService $service) {
		parent::__construct(Application::APP_ID, $request, $session);
		$this->service = $service;
	}

	/**
	 * @throws SecretNotFound
	 */
	protected function getPasswordHash(): string
	{
		$this->retrieveSecret();
		return $this->secret->getPwHash();
	}

	/**
	 * @throws SecretNotFound
	 * @throws InvalidArgumentException
	 * @return void
	 */
	private function retrieveSecret(): void {
		if (isset($this->secret)) {
			error_log("secret already set: " . $this->secret->getTitle());
			return;
		}
		if (!$this->getToken()) {
			throw new InvalidArgumentException("secret uuid is not defined");
		}
		$this->secret = $this->service->findPublic($this->getToken());
	}

	public function isValidToken(): bool
	{
		try {
			$this->retrieveSecret();
			return true;
		} catch (SecretNotFound | InvalidArgumentException $e) {
			error_log($e->getMessage());
			return false;
		}
	}

	/**
	 * @throws SecretNotFound
	 */
	protected function isPasswordProtected(): bool
	{
		$this->retrieveSecret();
		error_log("pw hash: " . $this->secret->getPwHash());
		return $this->secret->getPwHash() !== null;
	}

	/**
	 * @PublicPage
	 * @NoCSRFRequired
	 * @throws SecretNotFound
	 */
	public function get(): TemplateResponse {
		$this->retrieveSecret();
		Util::addScript(Application::APP_ID, 'secrets-main');

		return new TemplateResponse(Application::APP_ID, 'public',
			array("encrypted" => $this->secret->getEncrypted(), "iv" => $this->secret->getIv()));
	}
}
