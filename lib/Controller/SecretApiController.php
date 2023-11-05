<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Controller;

use DateTime;
use OCA\Secrets\AppInfo\Application;
use OCA\Secrets\Db\Secret;
use OCA\Secrets\Service\NotificationService;
use OCA\Secrets\Service\SecretNotFound;
use OCA\Secrets\Service\SecretService;
use OCA\Secrets\Service\UnauthorizedException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\OCS\OCSForbiddenException;
use OCP\AppFramework\OCS\OCSNotFoundException;
use OCP\AppFramework\OCSController;
use OCP\ILogger;
use OCP\IURLGenerator;
use \OCP\Notification\IManager as INotificationManager;
use OCP\IRequest;
use OCP\ISession;
use OCP\AppFramework\Http\Attribute\BruteForceProtection;

/**
 * @psalm-import-type SecretsData from ResponseDefinitions
 */
class SecretApiController extends OCSController
{
	private INotificationManager $notificationManager;
	private IURLGenerator $urlGenerator;
	private SecretService $service;
	private NotificationService $notificationService;
	private ?string $userId;
	private ILogger $logger;

	use Errors;

	public function __construct(IRequest             $request,
								SecretService        $service,
								NotificationService  $notificationService,
								INotificationManager $notificationManager,
								IURLGenerator        $urlGenerator,
								ILogger              $logger,
								?string              $userId)
	{
		parent::__construct(Application::APP_ID, $request);
		$this->service = $service;
		$this->notificationService = $notificationService;
		$this->userId = $userId;
		$this->notificationManager = $notificationManager;
		$this->urlGenerator = $urlGenerator;
		$this->logger = $logger;
	}

	/**
	 * Get all secrets for authenticated user
	 * @NoAdminRequired
	 *
	 * @return DataResponse<Http::STATUS_OK, array<array{
	 *        uuid: string,
	 *        title: string,
	 *        pwHash: null,
	 *        encrypted: string,
	 *        expires: string,
	 *        iv: string
	 *  }>, array{}>
	 * 200: Return list of secrets
	 */
	public function getAll(): DataResponse {
		return new DataResponse($this->service->findAll($this->userId));
	}

	/**
	 * Get secret with given uuid
	 * @NoAdminRequired
	 *
	 * @param string $uuid The uuid of the secret
	 *
	 * @return DataResponse<Http::STATUS_OK, SecretsData, array{}>|DataResponse<Http::STATUS_NOT_FOUND, array{message: string}, array{}>
	 * 200: Return secret with given uuid
	 * 404: Secret not found
	 */
	public function get(string $uuid): DataResponse {
		return $this->handleNotFound(function () use ($uuid) {
			return $this->service->find($uuid, $this->userId);
		});
	}

	/**
	 * Return the shared secret for the given uuid
	 *
	 * @PublicPage
	 *
	 * @param string $uuid The uuid of the secret
	 * @param string|null $password The password for the secret share
	 *
	 * @return DataResponse<Http::STATUS_NOT_FOUND, array{message: string}, array{}>|DataResponse<Http::STATUS_UNAUTHORIZED, array{message: string}, array{}>|DataResponse<Http::STATUS_OK, array{iv: string, encrypted: string}, array{}>
	 * 200: Return requested secret
	 * 404: Secret not found for uuid
	 * 401: Unauthorized
	 *
	 * TODO: Brute force protection
	 */
	public function retrieveSharedSecret(string $uuid, ?string $password): DataResponse
	{
		try {
			$secret = $this->service->retrieveAndInvalidateSecret($uuid, $password);
		} catch (SecretNotFound $e) {
			return new DataResponse(["message" => "No secret with the given uuid was found"], Http::STATUS_NOT_FOUND);
		} catch (UnauthorizedException $e) {
			return new DataResponse(["message" => "Forbidden"], Http::STATUS_UNAUTHORIZED);
		}

		$this->notificationService->notifyRetrieved($secret);

		$data = [
			'iv' => $secret->getIv(),
			'encrypted' => $secret->getEncrypted()
		];
		return new DataResponse($data, Http::STATUS_OK);
	}

	/**
	 * Store an e2e encrypted secret and return a share URL (without key portion)
	 *
	 * @NoAdminRequired
	 *
	 * @param string $title The title of the secret (visible to the owner only)
	 * @param string $encrypted The encrypted secret to store
	 * @param string $iv The iv for the encrypted secret
	 * @param ?string $expires (Optional) expiration date for the secret
	 * @param ?string $password (Optional) password to protect the secret share
	 *
	 * @return DataResponse<Http::STATUS_CREATED, SecretsData, array{}>|DataResponse<Http::STATUS_UNAUTHORIZED, array{message: string}, array{}>
	 * 201: Secret created
	 * 401: Unauthorized
	 */
	public function createSecret(string $title, string $encrypted, string $iv, ?string $expires, ?string $password)
	{
		if (!$this->userId) {
			return new DataResponse(['message' => 'Unauthorized'], Http::STATUS_UNAUTHORIZED);
		}
		return new DataResponse($this->service->create($title, $encrypted, $iv, $expires, $password, $this->userId)->jsonSerialize(), Http::STATUS_CREATED);
	}

	/**
	 * Update the title of a secret
	 * @NoAdminRequired
	 *
	 * @param string $uuid The uuid of the secret
	 * @param string $title The new title of the secret
	 *
	 * @return DataResponse<Http::STATUS_OK, SecretsData, array{}>|DataResponse<Http::STATUS_NOT_FOUND, array{message: string}, array{}>
	 * 200: Return updated secret
	 * 404: Secret not found
	 */
	public function updateTitle(string $uuid, string $title): DataResponse {
		return $this->handleNotFound(function () use ($uuid, $title) {
			return $this->service->updateTitle($uuid, $this->userId, $title);
		});
	}

	/**
	 * Delete the secret with the given uuid
	 *
	 * @NoAdminRequired
	 * @param string $uuid The uuid of the secret
	 *
	 * @return DataResponse<Http::STATUS_OK, array{message: string}, array{}>|DataResponse<Http::STATUS_NOT_FOUND, array{message: string}, array{}>
	 * 200: Secret deleted
	 * 404: Secret not found
	 */
	public function delete(string $uuid): DataResponse {
		try {
			$secret = $this->service->delete($uuid, $this->userId);
			return new DataResponse(['message' => "Secret '$secret->getTitle()' has been deleted"]);
		} catch (SecretNotFound $e) {
			return new DataResponse(['message' => "No secret found with uuid '$uuid'"], Http::STATUS_NOT_FOUND);
		}
	}
}
