<?php
declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Tests\Unit\Controller;

use PHPUnit\Framework\TestCase;

use OCP\AppFramework\Http;
use OCP\IRequest;

use OCA\Secrets\Service\SecretNotFound;
use OCA\Secrets\Service\SecretService;
use OCA\Secrets\Controller\SecretController;

class NoteControllerTest extends TestCase {
	protected SecretController $controller;
	protected string $userId = 'john';
	/** @var SecretService|MockObject */
	protected $service;
	/** @var IRequest|MockObject */
	protected $request;

	public function setUp(): void {
		$this->request = $this->getMockBuilder(IRequest::class)->getMock();
		$this->service = $this->getMockBuilder(SecretService::class)
			->disableOriginalConstructor()
			->getMock();
		$this->controller = new SecretController($this->request, $this->service, $this->userId);
	}

	public function testUpdateWithSuccess(): void {
		$this->service->expects($this->once())
			->method('updateTitle')
			->with($this->equalTo('3'),
					$this->equalTo($this->userId),
					$this->equalTo('title'));

		$this->controller->updateTitle('3', 'title');
	}


	public function testUpdateNotFound(): void {
		// test the correct status code if no note is found
		$this->service->expects($this->once())
			->method('updateTitle')
			->will($this->throwException(new SecretNotFound()));

		$result = $this->controller->updateTitle('3', 'title');

		$this->assertEquals(Http::STATUS_NOT_FOUND, $result->getStatus());
	}
}
