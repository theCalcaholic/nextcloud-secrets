<?php
declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Db;

use JsonSerializable;

use OCP\AppFramework\Db\Entity;

/**
 * @method getId(): int
 * @method getUUId(): string
 * @method setUuid(string $uuid): void
 * @method getTitle(): string
 * @method setTitle(string $title): void
 * @method getEncrypted(): string
 * @method setEncrypted(string $encrypted): void
 * @method getIv(): string
 * @method setIv(string $iv): void
 * @method getUserId(): string
 * @method setUserId(string $userId): void
 */
class Secret extends Entity implements JsonSerializable {
	protected string $title = '';
	protected string $encrypted = '';
	protected string $userId = '';
	protected string $uuid = '';
	protected string $iv = '';

	public function jsonSerialize(): array {
		return [
			'uuid' => $this->uuid,
			'title' => $this->title,
			'encrypted' => $this->encrypted,
			'iv' => $this->iv
		];
	}
}
