<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Cron;

use DateTime;
use OCA\Secrets\Service\SecretService;
use OCP\AppFramework\Utility\ITimeFactory;
use OCP\BackgroundJob\TimedJob;
use OCP\DB\Exception;
use Psr\Log\LoggerInterface;

class SecretExpiry extends TimedJob {
	private SecretService $service;
	private LoggerInterface $logger;

	public function __construct(ITimeFactory $time, SecretService $service, LoggerInterface $logger) {
		parent::__construct($time);
		$this->logger = $logger;
		$this->service = $service;
		$this->setInterval(12 * 3600);
	}

	/**
	 * @throws Exception
	 */
	protected function run($argument) {
		$dt = new DateTime('now');
		$this->service->expireSecrets($dt->format('Y-m-d'));
	}
}
