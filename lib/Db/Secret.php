<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Db;

use DateTime;
use InvalidArgumentException;
use JsonSerializable;

use OCP\AppFramework\Db\Entity;

/**
 * @method getId(): int
 * @method getUuid(): string
 * @method setUuid(string $uuid): void
 * @method getTitle(): string
 * @method setTitle(string $title): void
 * @method getEncrypted(): string
 * @method setEncrypted(?string $encrypted): void
 * @method getIv(): string
 * @method setIv(?string $iv): void
 * @method getUserId(): string
 * @method setUserId(string $userId): void
 * @method getPwHash(): ?string
 * @method setPwHash(?string $pwHash): void
 * @method getExpires(): ?string
 * @method setExpires(?string $expires): void
 */
class Secret extends Entity implements JsonSerializable {
	protected string $title = '';
	protected ?string $encrypted = null;
	protected string $userId = '';
	protected string $uuid = '';
	protected ?string $iv = '';
	protected ?string $pwHash = null;
	protected ?string $expires = null;

	public function __construct() {
		$this->addType('id', 'int');
	}

	public function getExpiryDate(): DateTime {
		$expiryDate = DateTime::createFromFormat("Y-m-d", $this->expires);
		if ($expiryDate === false) {
			throw new InvalidArgumentException("Error parsing date $this->expires");
		}
		return $expiryDate;
	}

	public function jsonSerialize(): array {
		return [
			'uuid' => $this->uuid,
			'title' => $this->title,
			// We make sure to never return the pw hash to the client
			'pwHash' => $this->pwHash === null ? null : '',
			'encrypted' => $this->encrypted,
			'expires' => $this->expires,
			'iv' => $this->iv
		];
	}
}
