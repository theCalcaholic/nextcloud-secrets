<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Tests\Unit\Service;

use OCA\Secrets\Db\Secret;
use OCA\Secrets\Db\SecretMapper;
use OCA\Secrets\Service\NotificationService;
use OCA\Secrets\Service\SecretNotFound;
use OCA\Secrets\Service\SecretService;
use OCP\Activity\IManager as IActivityManager;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Db\Entity;
use OCP\AppFramework\OCS\OCSBadRequestException;
use OCP\IURLGenerator;
use OCP\Notification\IManager as INotificationManager;
use PHPUnit\Framework\TestCase;
use Psr\Log\NullLogger;

class SecretServiceTest extends TestCase {
	private SecretService $service;
	private string $userId = 'john';
	private SecretMapper|MockObject $mapper;
	private INotificationManager|MockObject $notificationManager;
	private IActivityManager|MockObject $activityManager;
	private NotificationService $notificationService;
	private IURLGenerator|MockObject $urlGenerator;

	public function setUp(): void {
		$this->mapper = $this->getMockBuilder(SecretMapper::class)
			->disableOriginalConstructor()
			->getMock();
		$this->notificationManager = $this->getMockBuilder(INotificationManager::class)
			->getMock();
		$this->activityManager = $this->getMockBuilder(IActivityManager::class)
			->getMock();
		$this->urlGenerator = $this->getMockBuilder(IURLGenerator::class)
			->getMock();
		$this->notificationService = new NotificationService(
			$this->notificationManager,
			$this->urlGenerator,
			new NullLogger(),
			$this->activityManager
		);
		$this->service = new SecretService($this->mapper, new NullLogger(), $this->notificationService);
	}

	public function testUpdateWithSuccess(): void {
		// the existing note
		$secret = Secret::fromRow([
			'uuid' => '3',
			'title' => 'yo',
		]);
		$this->mapper->expects($this->once())
			->method('find')
			->with($this->equalTo('3'))
			->willReturn($secret);

		// the secret when updated
		$updatedSecret = Secret::fromRow(['uuid' => '3']);
		$updatedSecret->setTitle('title');
		$this->mapper->expects($this->once())
			->method('update')
			->with($this->equalTo($updatedSecret))
			->willReturn($updatedSecret);

		$result = $this->service->updateTitle('3', $this->userId, 'title');

		$this->assertEquals($updatedSecret, $result);
	}

	public function testUpdateNotFound(): void {
		$this->expectException(SecretNotFound::class);
		// test the correct status code if no note is found
		$this->mapper->expects($this->once())
			->method('find')
			->with($this->equalTo(3))
			->will($this->throwException(new DoesNotExistException('')));

		$this->service->updateTitle('3', $this->userId, 'title');
	}

	public function testCreateEmptyTitle(): void {
		$this->expectException(OCSBadRequestException::class);
		$title = '';
		$encrypted = 'someencryptedstring';
		$iv = 'someiv';
		$userId = 'someuser';
		$this->mapper->expects($this->never())
			->method('insert');

		$this->service->create($title, $encrypted, $iv, null, null, $userId);
	}

	public function testCreate(): void {
		$notificationService = $this->createMock(NotificationService::class);
		$service = new SecretService($this->mapper, new NullLogger(), $notificationService);
		$title = 'sometitle';
		$encrypted = 'someencryptedstring';
		$iv = 'someiv';
		$userId = 'someuser';

		$secret = new Secret();
		$secret->setTitle($title);
		$secret->setEncrypted($encrypted);
		$secret->setIv($iv);
		$secret->setUserId($userId);
		$this->mapper->method('insert')->willReturn($secret);
		$this->mapper->expects($this->once())
			->method('insert')
			->with($this->callback(function (Entity $secret) {
				$this->assertContains('title', array_keys($secret->getUpdatedFields()));
				$this->assertContains('encrypted', array_keys($secret->getUpdatedFields()));
				$this->assertContains('iv', array_keys($secret->getUpdatedFields()));
				return true;
			}));
		$notificationService->expects($this->once())->method('notifyCreated')->with($secret);

		$service->create($title, $encrypted, $iv, null, null, $userId);
	}
}
