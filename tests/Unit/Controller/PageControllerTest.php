<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Tests\Unit\Controller;

use OCA\Secrets\Controller\PageController;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\IConfig;
use OCP\IUser;
use OCP\IUserSession;
use OCP\Notification\IManager;

use PHPUnit\Framework\TestCase;

class PageControllerTest extends TestCase {
	private PageController $controller;

	public function setUp(): void {
		$request = $this->getMockBuilder(\OCP\IRequest::class)->getMock();
		$notificationManager = $this->getMockBuilder(IManager::class)->getMock();
		$user = $this->getMockBuilder(IUser::class)->getMock();
		$user->expects($this->any())
			->method('getUID')
			->will($this->returnValue('user'));
		$userSession = $this->getMockBuilder(IUserSession::class)->getMock();
		$userSession->expects($this->any())
			->method('getUser')
			->will($this->returnValue($user));
		$config = $this->getMockBuilder(IConfig::class)->getMock();
		$config->expects($this->any())->method('getSystemValueBool')->will($this->returnValue(true));
		$this->controller = new PageController($request, $notificationManager, $userSession, $config);
	}

	public function testIndex(): void {
		$result = $this->controller->index();

		$this->assertEquals('main', $result->getTemplateName());
		$this->assertTrue($result instanceof TemplateResponse);
	}
}
