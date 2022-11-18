<?php
declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Controller;

use OCA\Secrets\AppInfo\Application;
use OCA\Secrets\Service\SecretNotFound;
use OCA\Secrets\Service\SecretService;
use OCP\AppFramework\ApiController;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;
use OCP\ISession;

class SecretApiController extends ApiController {
	private SecretService $service;
	private ISession $session;
	private ?string $userId;

	use Errors;

	public function __construct(IRequest      $request,
								ISession $session,
                                SecretService $service) {
		parent::__construct(Application::APP_ID, $request);
		$this->service = $service;
		$this->session = $session;
	}

	/**
	 * @PublicPage
	 * @NoCSRFRequired
	 *
	 * @param string $uuid
	 * @return DataResponse
	 * @throws SecretNotFound
	 */
	public function getSecret(string $uuid): DataResponse {
		// TODO: Does it make sense to reenable the password parameter? Make sure to consider brute force protection
		$password = null;
		error_log($uuid);
		$secret = $this->service->findPublic($uuid);
		if ($secret->getEncrypted() === null) {
			return new DataResponse(array(), 404);
		}

		$pwHash = null;
		if ($password) {
			$pwHash = hash("sha256", $password . $secret->getUuid());
		} else if ($this->session->get('public_link_authenticated_token') === $uuid) {
			$pwHash = $this->session->get('public_link_authenticated_password_hash');
		}
		if ($secret->getPwHash() !== null && $secret->getPwHash() !== $pwHash) {
			return new DataResponse(array(), 401);
		}

		$this->service->invalidate($secret->getUuid());
		$data = array(
			'iv' => $secret->getIv(),
			'encrypted' => $secret->getEncrypted()
		);
		return new DataResponse($data);
	}
}
