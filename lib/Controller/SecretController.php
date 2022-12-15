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
	 * @NoAdminRequired
	 */
	public function create(string $title, string $encrypted, string $iv, ?string $expires, ?string $password): DataResponse {
		error_log("create_secret( $title, $encrypted, $iv )");
		return new DataResponse($this->service->create($title, $encrypted, $iv, $expires, $password, $this->userId));
	}

	/**
	 * @NoAdminRequired
	 *
	 * @param string $uuid
	 * @param string $title
	 */
	public function updateTitle(string $uuid, string $title): DataResponse {
		return $this->handleNotFound(function () use ($uuid, $title) {
			return $this->service->updateTitle($uuid, $this->userId, $title);
		});
	}

	/**
	 * @NoAdminRequired
	 * @param string $uuid
	 * @return DataResponse
	 */
	public function delete(string $uuid): DataResponse {
		return $this->handleNotFound(function () use ($uuid) {
			return $this->service->delete($uuid, $this->userId);
		});
	}
}
