<?php

// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Cron;

use DateInterval;
use DateTime;
use OCA\Secrets\Service\SecretService;
use OCP\BackgroundJob\TimedJob;
use OCP\AppFramework\Utility\ITimeFactory;
use OCP\DB\Exception;
use Psr\Log\LoggerInterface;

class SecretCleanup extends TimedJob {
	private SecretService $service;
	private LoggerInterface $logger;

	public function __construct(ITimeFactory $time, SecretService $service, LoggerInterface $logger) {
		parent::__construct($time);
		$this->logger = $logger;
		$this->service = $service;
		$this->setInterval(300);
	}

	/**
	 * @throws Exception
	 */
	protected function run($argument) {
		$this->logger->warning("CRON: Cleaning expired secrets...");
		$dt = new DateTime();
		$dt->sub(new DateInterval('P6D'));
		$this->service->deleteExpiredAfter($dt->format('Y-m-d'));
	}
}
