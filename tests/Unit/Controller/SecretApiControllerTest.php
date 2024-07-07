<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Tests\Unit\Controller;

use OCA\Secrets\Service\NotificationService;
use OCP\App\IAppManager;
use OCP\ILogger;
use OCP\ISession;
use OCP\IURLGenerator;
use OCP\Notification\IManager as INotificationManager;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

use OCP\AppFramework\Http;
use OCP\IRequest;

use OCA\Secrets\Service\SecretNotFound;
use OCA\Secrets\Service\SecretService;
use OCA\Secrets\Controller\SecretApiController;

class SecretApiControllerTest extends TestCase {
	protected SecretApiController $controller;
	protected string $userId = 'john';
	/** @var SecretService|MockObject */
	protected $service;
	/** @var IRequest|MockObject */
	protected $request;
    /** @var ISession|MockObject */
    protected $session;
    /** @var NotificationService|MockObject */
    protected $notificationService;
    /** @var INotificationManager|MockObject */
    protected $notificationManager;
    /** @var IURLGenerator|MockObject */
    protected $urlGenerator;
    /** @var ILogger|MockObject */
	protected $logger;
    /** @var IAppManager|MockObject */
    protected $appManager;

	public function setUp(): void {
		$this->request = $this->getMockBuilder(IRequest::class)->getMock();
		$this->service = $this->getMockBuilder(SecretService::class)
			->disableOriginalConstructor()
			->getMock();
        $this->session = $this->getMockBuilder(ISession::class)->getMock();
        $this->notificationService = $this->getMockBuilder(NotificationService::class)
            ->disableOriginalConstructor()
            ->getMock();
        $this->urlGenerator = $this->getMockBuilder(IURLGenerator::class)->getMock();
        $this->notificationManager = $this->getMockBuilder(INotificationManager::class)->getMock();
        $this->logger = $this->getMockBuilder(ILogger::class)->getMock();
        $this->appManager = $this->getMockBuilder(IAppManager::class)
            ->getMock();


		$this->controller = new SecretApiController($this->request, $this->service, $this->session,
            $this->notificationService, $this->notificationManager, $this->urlGenerator, $this->appManager, $this->logger, $this->userId);
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
