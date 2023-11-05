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
use OCP\AppFramework\Http\TemplateResponse;
use OCP\IConfig;
use OCP\IRequest;

use OCP\ISession;
use OCP\IURLGenerator;
use OCP\Util;

class SecretShareController extends AuthPublicShareController {
	private SecretService $service;
	private Secret $secret;
	private bool $debug;

	public function __construct(IRequest      $request,
								ISession      $session,
								SecretService $service,
								IURLGenerator $urlGenerator,
								IConfig $config) {
		parent::__construct(Application::APP_ID, $request, $session, $urlGenerator);
		$this->service = $service;
		$this->debug = $config->getSystemValueBool("debug");
	}

	/**
	 * @throws SecretNotFound
	 */
	protected function getPasswordHash(): string {
		return $this->getSecret()->getPwHash();
	}

	/**
	 * @return void
	 * @throws InvalidArgumentException
	 * @throws SecretNotFound
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

	public function isValidToken(): bool {
		try {
			return $this->getSecret() !== null;
		} catch (SecretNotFound|InvalidArgumentException $e) {
			error_log($e->getMessage());
			return false;
		}
	}

	/**
	 * @throws SecretNotFound
	 */
	protected function isPasswordProtected(): bool {
		return $this->getSecret()->getPwHash() !== null;
	}

	protected function verifyPassword(string $password): bool {
		try {
			return hash("sha256", $password . $this->getSecret()->getUuid()) === $this->getPasswordHash();
		} catch (SecretNotFound $e) {
			return false;
		}
	}

	/**
	 * Show the authentication page
	 * The form has to submit to the authenticate method route
	 *
	 * @PublicPage
	 *
	 * @return TemplateResponse<Http::STATUS_OK, string>
	 * 200: Show authentication page
	 *
	 * @since 14.0.0
	 */
	public function showAuthenticate(): TemplateResponse {
		error_log("showAuthenticate");
		return new TemplateResponse('secrets', 'publicshareauth',
			["debug" => $this->debug], 'guest');
	}

	/**
	 * The template to show when authentication failed
	 *
	 * @return TemplateResponse<Http::STATUS_OK, string>
	 * 200: Show authentication failure page
	 *
	 * @since 14.0.0
	 *
	 */
	protected function showAuthFailed(): TemplateResponse {
		return new TemplateResponse('secrets', 'publicshareauth', ['wrongpw' => true, 'debug' => $this->debug], 'guest');
	}

	/**
	 * The template to show after user identification
	 *
	 * @return TemplateResponse<Http::STATUS_OK, string>
	 * 200: Show user identification success page
	 *
	 * @since 24.0.0
	 */
	protected function showIdentificationResult(bool $success): TemplateResponse {
		return new TemplateResponse('secrets', 'publicshareauth', ['identityOk' => $success, 'debug' => $this->debug], 'guest');
	}

	/**
	 * Show shared secret page
	 *
	 * @PublicPage
	 * @NoCSRFRequired
	 *
	 * @return TemplateResponse<Http::STATUS_OK, string>
	 * 200: Show secret share page
	 */
	public function showShare(): TemplateResponse {
		Util::addScript(Application::APP_ID, 'secrets-public');

		$resp = new TemplateResponse(Application::APP_ID, 'public', ['debug' => $this->debug], TemplateResponse::RENDER_AS_BASE);
		return $resp;
	}

}
