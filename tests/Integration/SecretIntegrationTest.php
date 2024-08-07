<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Tests\Integration\Controller;

use OCA\Secrets\Controller\SecretApiController;
use OCA\Secrets\Db\Secret;
use OCA\Secrets\Db\SecretMapper;

use OCA\Secrets\Service\SecretService;
use OCP\AppFramework\App;
use OCP\AppFramework\Db\QBMapper;
use OCP\IRequest;
use PHPUnit\Framework\TestCase;

class SecretIntegrationTest extends TestCase {
	private SecretApiController $controller;
	private QBMapper $mapper;
	private string $userId = 'john';

	public function setUp(): void {
		$app = new App('secrets');
		$container = $app->getContainer();

		// only replace the user id
		$container->registerService('userId', function () {
			return $this->userId;
		});

		// we do not care about the request but the controller needs it
		$container->registerService(IRequest::class, function () {
			return $this->createMock(IRequest::class);
		});

		$this->controller = $container->get(SecretApiController::class);
		$this->mapper = $container->get(SecretMapper::class);
	}

	public function testUpdate(): void {
		$uuid = SecretService::getRandomUuid();
		// create a new note that should be updated
		$secret = new Secret();
		$secret->setTitle('old_title');
		$secret->setUuid($uuid);
		$secret->setUserId($this->userId);

		$newSecret = $this->mapper->insert($secret);

		// fromRow does not set the fields as updated
		$updatedSecret = Secret::fromRow([
			'uuid' => $uuid,
			'user_id' => $this->userId
		]);
		$updatedSecret->setTitle('title');

		$result = $this->controller->updateTitle($uuid, 'title');

		$this->assertEquals('title', $result->getData()->getTitle());

		// clean up
		$this->mapper->delete($result->getData());
	}
}
