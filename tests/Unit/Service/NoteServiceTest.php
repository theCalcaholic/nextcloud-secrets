<?php
declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: GPL-3.0-or-later

namespace OCA\Secrets\Tests\Unit\Service;

use OCA\Secrets\Service\SecretNotFound;
use PHPUnit\Framework\TestCase;

use OCP\AppFramework\Db\DoesNotExistException;

use OCA\Secrets\Db\Secret;
use OCA\Secrets\Service\SecretService;
use OCA\Secrets\Db\SecretMapper;

class NoteServiceTest extends TestCase {
	private SecretService $service;
	private string $userId = 'john';
	private $mapper;

	public function setUp(): void {
		$this->mapper = $this->getMockBuilder(SecretMapper::class)
			->disableOriginalConstructor()
			->getMock();
		$this->service = new SecretService($this->mapper);
	}

	public function testUpdate(): void {
		// the existing note
		$note = Secret::fromRow([
			'id' => 3,
			'title' => 'yo',
			'content' => 'nope'
		]);
		$this->mapper->expects($this->once())
			->method('find')
			->with($this->equalTo(3))
			->will($this->returnValue($note));

		// the note when updated
		$updatedNote = Secret::fromRow(['id' => 3]);
		$updatedNote->setTitle('title');
		$updatedNote->setEncrypted('content');
		$this->mapper->expects($this->once())
			->method('update')
			->with($this->equalTo($updatedNote))
			->will($this->returnValue($updatedNote));

		$result = $this->service->update(3, 'title', 'content', $this->userId);

		$this->assertEquals($updatedNote, $result);
	}

	public function testUpdateNotFound(): void {
		$this->expectException(SecretNotFound::class);
		// test the correct status code if no note is found
		$this->mapper->expects($this->once())
			->method('find')
			->with($this->equalTo(3))
			->will($this->throwException(new DoesNotExistException('')));

		$this->service->update(3, 'title', 'content', $this->userId);
	}
}
