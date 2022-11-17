<?php
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: GPL-3.0-or-later

namespace OCA\Secrets\Cron;

use DateInterval;
use DateTime;
use OCA\Secrets\Service\SecretService;
use OCP\BackgroundJob\TimedJob;
use OCP\AppFramework\Utility\ITimeFactory;
use OCP\DB\Exception;

class CleanupExpiredSecrets extends TimedJob {
	private SecretService $service;

	public function __construct(ITimeFactory $time, $service)
	{
		parent::__construct($time);
		$this->service = $service;
		$this->setInterval(24*3600);
	}

	/**
	 * @throws Exception
	 */
	protected function run($argument)
	{
		$dt = new DateTime();
		$dt->add(New DateInterval('P7d'));
		$this->service->deleteExpiredAfter($dt->format('Y-m-d'));
	}
}
?>
