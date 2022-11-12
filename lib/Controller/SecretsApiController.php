<?php
declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Controller;

use OCA\Secrets\AppInfo\Application;
use OCA\Secrets\Service\SecretService;
use OCP\AppFramework\ApiController;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;

class SecretsApiController extends ApiController {
	private SecretService $service;
	private ?string $userId;

	use Errors;

	public function __construct(IRequest      $request,
                                SecretService $service,
                                ?string       $userId) {
		parent::__construct(Application::APP_ID, $request);
		$this->service = $service;
		$this->userId = $userId;
	}

	/**
	 * @CORS
	 * @NoCSRFRequired
	 * @NoAdminRequired
	 */
	public function index(): DataResponse {
		return new DataResponse($this->service->findAll($this->userId));
	}

	/**
	 * @CORS
	 * @NoCSRFRequired
	 * @NoAdminRequired
	 */
	public function show(string $uuid): DataResponse {
		return $this->handleNotFound(function () use ($uuid) {
			return $this->service->find($uuid, $this->userId);
		});
	}

	/**
	 * @CORS
	 * @NoCSRFRequired
	 * @NoAdminRequired
	 */
	public function create(string $title, string $encrypted, $iv): DataResponse {
		return new DataResponse($this->service->create($title, $encrypted, $iv, $this->userId));
	}

	/**
	 * @CORS
	 * @NoCSRFRequired
	 * @NoAdminRequired
	 */
	public function destroy(string $uuid): DataResponse {
		return $this->handleNotFound(function () use ($uuid) {
			return $this->service->delete($uuid, $this->userId);
		});
	}
}
