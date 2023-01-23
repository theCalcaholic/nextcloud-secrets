<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Db;

use DateTime;
use DateTimeInterface;
use InvalidArgumentException;
use JsonSerializable;

use OCP\AppFramework\Db\Entity;
use Psr\Log\LoggerInterface;

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

const DATETIME_FORMAT_INTERNAL = 'Y-m-d H:i:s';
const DATETIME_FORMAT_ISO8601 = 'Y-m-d\TH:i:s.uP';
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

//	public function getExpiryDate(): DateTime {
//		$expiryDate = DateTime::createFromFormat("Y-m-d", $this->expires);
//		if ($expiryDate === false) {
//			throw new InvalidArgumentException("Error parsing date $this->expires");
//		}
//		return $expiryDate;
//	}

	/**
	 * @param $date_str ?string
	 * @return ?DateTime
	 */
	static public function ISO8601ToDateTime(?string $date_str): ?DateTime {
		if ( $date_str == null ) {
			return null;
		}

		$date = DateTime::createFromFormat(DATETIME_FORMAT_ISO8601, $date_str);

		if (!$date)
			throw new InvalidArgumentException("Invalid date format: " . $date_str);

		return $date;
	}

	/**
	 * @param string|null $date_str
	 * @return void
	 */
	public function setExpiresFromISO8601String(?string $date_str): void
	{
		if ($date_str == null) {
			$this->setExpires(null);
			return;
		}

		$date = DateTime::createFromFormat(DATETIME_FORMAT_ISO8601, $date_str);
		$this->setExpires($date->format(DATETIME_FORMAT_INTERNAL));
	}

	/**
	 * @return DateTime|null
	 */
	public function getExpiresAsDateTime(): ?DateTime {
		if ($this->expires == null) {
			return null;
		}

		return DateTime::createFromFormat(DATETIME_FORMAT_INTERNAL, $this->expires);
	}

	public function getExpiresAsISO8601(): ?string {
		return $this->getExpiresAsDateTime()?->format(DATETIME_FORMAT_ISO8601);
	}

	public function jsonSerialize(): array {
		return [
			'uuid' => $this->uuid,
			'title' => $this->title,
			// We make sure to never return the pw hash to the client
			'pwHash' => $this->pwHash === null ? null : '',
			'encrypted' => $this->encrypted,
			'expires' => $this->getExpiresAsISO8601(),
			'iv' => $this->iv
		];
	}
}
