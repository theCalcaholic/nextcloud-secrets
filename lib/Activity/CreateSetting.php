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

	public function getIdentifier() {
		return CreateSetting::IDENTIFIER;
	}

	public function getName() {
		$this->l->t('You have created a <strong>Secret</strong>');
	}

	public function getPriority() {
		return 50;
	}

	public function canChangeStream() {
		return true;
	}

	public function isDefaultEnabledStream() {
		return false;
	}

	public function canChangeMail() {
		return true;
	}

	public function isDefaultEnabledMail() {
		return false;
	}
}
