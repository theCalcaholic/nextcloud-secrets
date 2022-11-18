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
use OCP\AppFramework\AuthPublicShareController;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\IRequest;

use OCP\ISession;
use OCP\IURLGenerator;
use OCP\Util;

class SecretShareController extends AuthPublicShareController {
	private SecretService $service;
	private Secret $secret;

	public function __construct(IRequest      $request,
								ISession $session,
								SecretService $service,
								IURLGenerator $urlGenerator) {
		parent::__construct(Application::APP_ID, $request, $session, $urlGenerator);
		$this->service = $service;
	}

	/**
	 * @throws SecretNotFound
	 */
	protected function getPasswordHash(): string
	{
		return $this->getSecret()->getPwHash();
	}

	/**
	 * @throws SecretNotFound
	 * @throws InvalidArgumentException
	 * @return void
	 */
	private function getSecret(): ?Secret {
		if (!isset($this->secret)) {
			if (!$this->getToken()) {
				throw new InvalidArgumentException("secret uuid is not defined");
			}
			$this->secret = $this->service->findPublic($this->getToken());
		}
		return $this->secret;
	}

	public function isValidToken(): bool
	{
		try {
			return $this->getSecret() !== null;
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
		return $this->getSecret()->getPwHash() !== null;
	}

	protected function verifyPassword(string $password): bool
	{
		try {
			return hash("sha256", $password . $this->getSecret()->getUuid()) === $this->getPasswordHash();
		} catch (SecretNotFound $e) {
			return false;
		}
	}

	/**
	 * @PublicPage
	 * @NoCSRFRequired
	 *
	 * Show the authentication page
	 * The form has to submit to the authenticate method route
	 *
	 * @since 14.0.0
	 */
	public function showAuthenticate(): TemplateResponse {
		error_log("showAuthenticate");
		return new TemplateResponse('secrets', 'publicshareauth',
			[], 'guest');
	}

	/**
	 * The template to show when authentication failed
	 *
	 * @since 14.0.0
	 */
	protected function showAuthFailed(): TemplateResponse {
		error_log("showAuthFailed");
		return new TemplateResponse('secrets', 'publicshareauth', ['wrongpw' => true], 'guest');
	}

	/**
	 * The template to show after user identification
	 *
	 * @since 24.0.0
	 */
	protected function showIdentificationResult(bool $success): TemplateResponse {
		error_log("showIdentificationResult");
		return new TemplateResponse('secrets', 'publicshareauth', ['identityOk' => $success], 'guest');
	}

	/**
	 * @PublicPage
	 * @NoCSRFRequired
	 *
	 * @throws SecretNotFound
	 */
	public function showShare(): TemplateResponse
	{
		Util::addScript(Application::APP_ID, 'secrets-main');

		$resp = new TemplateResponse(Application::APP_ID, 'public', []);
			//array("encrypted" => $this->getSecret()->getEncrypted(), "iv" => $this->getSecret()->getIv()));

		error_log("pw hash: " . $this->getSecret()->getPwHash());
		//$this->service->invalidate($this->getSecret()->getUuid());
		return $resp;
	}

}
