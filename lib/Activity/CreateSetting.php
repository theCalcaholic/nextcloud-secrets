<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Activity;

use OCP\Activity\ISetting;
use OCP\IL10N;

class CreateSetting implements ISetting {
	public const IDENTIFIER = 'secret_creation';
	protected IL10N $l;

	public function __construct(IL10N $l) {
		$this->l = $l;
	}

	public function getIdentifier(): string {
		return CreateSetting::IDENTIFIER;
	}

	public function getName(): string {
		return $this->l->t('A <strong>Secret</strong> was created');
	}

	public function getPriority(): int {
		return 50;
	}

	public function canChangeStream(): bool {
		return true;
	}

	public function isDefaultEnabledStream(): bool {
		return false;
	}

	public function canChangeMail(): bool {
		return true;
	}

	public function isDefaultEnabledMail(): bool {
		return false;
	}
}
