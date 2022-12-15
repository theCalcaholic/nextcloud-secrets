<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Tests\Integration\Controller;

use OCP\AppFramework\App;
use OCP\IRequest;
use PHPUnit\Framework\TestCase;

use OCA\Secrets\Db\Secret;
use OCA\Secrets\Db\SecretMapper;
use OCA\Secrets\Controller\SecretController;
use OCA\Secrets\Service\SecretService;
use OCP\AppFramework\Db\QBMapper;

class NoteIntegrationTest extends TestCase {
	private SecretController $controller;
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

		$this->controller = $container->get(SecretController::class);
		$this->mapper = $container->get(SecretMapper::class);
	}

	public function testUpdate(): void {
		$uuid = SecretService::getRandomUuid();
		// create a new note that should be updated
		$note = new Secret();
		$note->setTitle('old_title');
		$note->setUuid($uuid);
		$note->setUserId($this->userId);

		$newNote = $this->mapper->insert($note);

		// fromRow does not set the fields as updated
		$updatedNote = Secret::fromRow([
			'uuid' => $uuid,
			'user_id' => $this->userId
		]);
		$updatedNote->setTitle('title');

		$result = $this->controller->updateTitle($uuid, 'title');

		$this->assertEquals('title', $result->getData()->getTitle());

		// clean up
		$this->mapper->delete($result->getData());
	}
}
