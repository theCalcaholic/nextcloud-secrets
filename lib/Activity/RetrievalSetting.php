<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Activity;

use OCP\Activity\ISetting;
use OCP\IL10N;

class RetrievalSetting implements ISetting {
	public const IDENTIFIER = 'secret_retrieval';
	protected IL10N $l;

	public function __construct(IL10N $l) {
		$this->l = $l;
	}

	public function getIdentifier() {
		return RetrievalSetting::IDENTIFIER;
	}

	public function getName() {
		$this->l->t('A <strong>Secret</strong> was retrieved');
	}

	public function getPriority() {
		return 50;
	}

	public function canChangeStream() {
		return true;
	}

	public function isDefaultEnabledStream() {
		return true;
	}

	public function canChangeMail() {
		return true;
	}

	public function isDefaultEnabledMail() {
		return false;
	}
}
