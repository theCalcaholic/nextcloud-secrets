<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Tests\Unit\Service;

use OCA\Secrets\Service\SecretNotFound;
use PHPUnit\Framework\TestCase;

use OCP\AppFramework\Db\DoesNotExistException;

use OCA\Secrets\Db\Secret;
use OCA\Secrets\Service\SecretService;
use OCA\Secrets\Db\SecretMapper;
use Psr\Log\NullLogger;

class SecretServiceTest extends TestCase {
	private SecretService $service;
	private string $userId = 'john';
	/** @var SecretMapper|MockObject */
	private $mapper;

	public function setUp(): void {
		$this->mapper = $this->getMockBuilder(SecretMapper::class)
			->disableOriginalConstructor()
			->getMock();
		$this->service = new SecretService($this->mapper, new NullLogger());
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
			->will($this->returnValue($note));

		// the note when updated
		$updatedNote = Secret::fromRow(['uuid' => '3']);
		$updatedNote->setTitle('title');
		$this->mapper->expects($this->once())
			->method('update')
			->with($this->equalTo($updatedNote))
			->will($this->returnValue($updatedNote));

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
