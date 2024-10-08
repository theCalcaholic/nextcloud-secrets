<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Service;

use Exception;

use OCA\Secrets\Db\Secret;
use OCA\Secrets\Db\SecretMapper;

use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Db\MultipleObjectsReturnedException;
use Psr\Log\LoggerInterface;

class SecretService {
	private SecretMapper $mapper;
	private LoggerInterface $logger;

	public function __construct(SecretMapper $mapper, LoggerInterface $logger) {
		$this->mapper = $mapper;
		$this->logger = $logger;
	}

	/**
	 * @param string $userId
	 * @return array<Secret>
	 */
	public function findAll(string $userId): array {
		return $this->mapper->findAll($userId);
	}

	/**
	 * @return never
	 * @throws SecretNotFound
	 */
	private function handleException(Exception $e) {
		if ($e instanceof DoesNotExistException ||
			$e instanceof MultipleObjectsReturnedException) {
			throw new SecretNotFound($e->getMessage());
		} else {
			throw $e;
		}
	}

	public function find(string $uuid, string $userId): Secret {
		try {
			return $this->mapper->find($uuid, $userId);
		} catch (Exception $e) {
			$this->handleException($e);
		}
	}

	/**
	 * @param string $uuid
	 * @return Secret
	 * @throws SecretNotFound
	 */
	public function findPublic(string $uuid): Secret {
		try {
			$secret = $this->mapper->findPublic($uuid);
			return $secret;
		} catch (Exception $e) {
			$this->handleException($e);
		}
	}

	public static function getRandomUuid(): string {
		$uuid_bytes = openssl_random_pseudo_bytes(16);
		$uuid_bytes[6] = chr(ord($uuid_bytes[6]) & 0x0f | 0x40); // set version to 4 (0100)
		$uuid_bytes[8] = chr(ord($uuid_bytes[8]) & 0x3f | 0x80); // set bits 6-7 to 10

		return bin2hex($uuid_bytes);
	}

	public function create(string $title, string $encrypted, string $iv, ?string $expires, ?string $password, string $userId): Secret {
		$uuid = self::getRandomUuid();

		$secret = new Secret();
		$secret->setUuid($uuid);
		$secret->setTitle($title);
		$secret->setEncrypted($encrypted);
		$secret->setIv($iv);
		$secret->setUserId($userId);
		$secret->setExpiresFromISO8601String($expires);
		$secret->setPwHash($password ? hash("sha256", $password . $secret->getUuid()) : null);
		return $this->mapper->insert($secret);
	}

	/**
	 * @throws DoesNotExistException
	 * @throws MultipleObjectsReturnedException
	 */
	public function getId(string $uuid): int {
		return $this->mapper->getId($uuid);
	}

	/**
	 * @throws SecretNotFound
	 */
	public function invalidate(string $uuid): Secret {
		try {
			return $this->mapper->invalidate($uuid);
		} catch (Exception $e) {
			$this->handleException($e);
		}
	}

	/**
	 * @throws \OCP\DB\Exception
	 */
	public function deleteExpiredAfter(string $date): void {
		$this->mapper->deleteExpired($date);
	}

	/**
	 * @throws SecretNotFound
	 */
	public function delete(string $uuid, string $userId): Secret {
		try {
			$secret = $this->mapper->find($uuid, $userId);
			$this->mapper->delete($secret);
			return $secret;
		} catch (Exception $e) {
			$this->handleException($e);
		}
	}

	/**
	 *
	 * @throws SecretNotFound
	 */
	public function updateTitle(string $uuid, string $userId, string $title): Secret {
		try {
			$secret = $this->mapper->find($uuid, $userId);
			$secret->setTitle($title);
			return $this->mapper->update($secret);
		} catch (Exception $e) {
			$this->handleException($e);
		}
	}

	/**
	 * @param string $uuid
	 * @param string|null $password
	 *
	 * @return Secret
	 * @throws SecretNotFound
	 * @throws UnauthorizedException
	 */
	public function retrieveAndInvalidateSecret(string $uuid, ?string $pwHash): Secret {
		$secret = $this->findPublic($uuid);
		if ($secret->getEncrypted() === null) {
			throw new SecretNotFound();
		}

		if ($secret->getPwHash() !== null && $secret->getPwHash() !== $pwHash) {
			throw new UnauthorizedException();
		}
		$uuid = $secret->getUuid();
		$this->invalidate($uuid);

		return $secret;
	}
}
