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
		$note = Secret::fromRow([
			'uuid' => '3',
			'title' => 'yo',
		]);
		$this->mapper->expects($this->once())
			->method('find')
			->with($this->equalTo('3'))
			->willReturn($note);

		// the note when updated
		$updatedNote = Secret::fromRow(['uuid' => '3']);
		$updatedNote->setTitle('title');
		$this->mapper->expects($this->once())
			->method('update')
			->with($this->equalTo($updatedNote))
			->willReturn($updatedNote);

		$result = $this->service->updateTitle('3', $this->userId, 'title');

		$this->assertEquals($updatedNote, $result);
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
}
