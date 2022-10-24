<?php
declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Controller;

use OCA\Secrets\AppInfo\Application;
use OCA\Secrets\Service\SecretService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;

class SecretController extends Controller {
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
	 * @NoAdminRequired
	 */
	public function index(): DataResponse {
		return new DataResponse($this->service->findAll($this->userId));
	}

	/**
	 * @NoAdminRequired
	 * @PublicPage
	 */
	public function show(string $uuid): DataResponse {
		return $this->handleNotFound(function () use ($uuid) {
			return $this->service->find($uuid, $this->userId);
		});
	}

	/**
	 * @CORS
	 * @PublicPage
	 * @NoCSRFRequired
	 * @param string $uuid
	 * @return DataResponse
	 */
	public function showPublic(string $uuid): DataResponse {
		return $this->handleNotFound(function () use ($uuid) {
			return $this->service->findPublic($uuid);
		});
	}

	/**
	 * @NoAdminRequired
	 */
	public function create(string $title, string $encrypted, string $iv): DataResponse {
		error_log("create_secret( $title, $encrypted, $iv )");
		return new DataResponse($this->service->create($title, $encrypted, $iv, $this->userId));
	}

	/**
	 * @NoAdminRequired
	 */
	public function update(string $uuid, string $title,
						   string $encrypted, string $iv): DataResponse {
		return $this->handleNotFound(function () use ($uuid, $title, $encrypted, $iv) {
			return $this->service->update($uuid, $title, $encrypted, $iv, $this->userId);
		});
	}

	/**
	 * @NoAdminRequired
	 */
	public function destroy(string $uuid): DataResponse {
		return $this->handleNotFound(function () use ($uuid) {
			return $this->service->delete($uuid, $this->userId);
		});
	}
}
