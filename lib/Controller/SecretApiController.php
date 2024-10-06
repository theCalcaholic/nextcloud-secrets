<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Controller;

use OCA\Secrets\AppInfo\Application;
use OCA\Secrets\Service\NotificationService;
use OCA\Secrets\Service\SecretNotFound;
use OCA\Secrets\Service\SecretService;
use OCA\Secrets\Service\UnauthorizedException;
use OCP\App\IAppManager;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\Attribute\BruteForceProtection;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\OCSController;
use OCP\IRequest;
use OCP\ISession;
use OCP\IURLGenerator;
use OCP\Notification\IManager as INotificationManager;
use Psr\Log\LoggerInterface;

/**
 * @psalm-import-type SecretsData from ResponseDefinitions
 */
class SecretApiController extends OCSController {
	private INotificationManager $notificationManager;
	private IURLGenerator $urlGenerator;
	private SecretService $service;
	private NotificationService $notificationService;
	private ?string $userId;
	private LoggerInterface $logger;
	private ISession $session;
	private string $appVersion;

	use Errors;

	public function __construct(IRequest             $request,
		SecretService        $service,
		ISession $session,
		NotificationService  $notificationService,
		INotificationManager $notificationManager,
		IURLGenerator        $urlGenerator,
		IAppManager          $appManager,
		LoggerInterface      $logger,
		?string              $userId) {
		parent::__construct(Application::APP_ID, $request);
		$this->service = $service;
		$this->notificationService = $notificationService;
		$this->userId = $userId;
		$this->notificationManager = $notificationManager;
		$this->urlGenerator = $urlGenerator;
		$this->logger = $logger;
		$this->session = $session;
		$this->appVersion = $appManager->getAppInfo(Application::APP_ID)["version"];
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
	 * Return the secrets app/api version
	 *
	 * @PublicPage
	 * @NoCSRFRequired
	 *
	 * @return DataResponse<Http::STATUS_OK, array{version: string}, array{}>
	 * 200: Return application/api version
	 *
	 */
	#[AnonRateLimit(limit: 120, period: 60)]
	public function getVersion(): DataResponse {
		return new DataResponse(['version' => $this->appVersion], Http::STATUS_OK);
	}

	/**
	 * Return the shared secret for the given uuid
	 *
	 * @PublicPage
	 * @NoCSRFRequired
	 *
	 * @param string $uuid The uuid of the secret
	 * @param string|null $password The password for the secret share
	 *
	 * @return DataResponse<Http::STATUS_NOT_FOUND, array{message: string}, array{}>|DataResponse<Http::STATUS_UNAUTHORIZED, array{message: string}, array{}>|DataResponse<Http::STATUS_OK, array{iv: string, encrypted: string}, array{}>
	 * 200: Return requested secret
	 * 404: Secret not found for uuid
	 * 401: Unauthorized
	 *
	 */
	#[UserRateLimit(limit: 500, period: 60)]
	#[AnonRateLimit(limit: 120, period: 60)]
	#[BruteForceProtection(action: 'retrieval')]
	#[BruteForceProtection(action: 'password')]
	public function retrieveSharedSecret(string $uuid, ?string $password): DataResponse {

		$pwHash = null;
		if ($password) {
			$pwHash = hash("sha256", $password . $uuid);
		} elseif ($this->session->get('public_link_authenticated_token') === $uuid) {
			$pwHash = $this->session->get('public_link_authenticated_password_hash');
		}
		try {
			$secret = $this->service->retrieveAndInvalidateSecret($uuid, $pwHash);
		} catch (SecretNotFound $e) {
			$resp = new DataResponse(["message" => "No secret with the given uuid was found"], Http::STATUS_NOT_FOUND);
			$resp->throttle(['action' => 'retrieval']);
			return $resp;
		} catch (UnauthorizedException $e) {
			$resp = new DataResponse(["message" => "Forbidden"], Http::STATUS_UNAUTHORIZED);
			$resp->throttle(['action' => 'password']);
			return $resp;
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
	public function createSecret(string $title, string $encrypted, string $iv, ?string $expires, ?string $password) {
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
			return new DataResponse(['message' => "Secret '{$secret->getTitle()}' has been deleted"]);
		} catch (SecretNotFound $e) {
			return new DataResponse(['message' => "No secret found with uuid '$uuid'"], Http::STATUS_NOT_FOUND);
		}
	}
}
