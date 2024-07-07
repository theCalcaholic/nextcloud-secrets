<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Controller;

use OCA\Secrets\AppInfo\Application;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\Util;

class RedirectController extends Controller {

	/**
	 * Show shared secret page
	 *
	 * @PublicPage
	 * @NoCSRFRequired
	 *
	 * @return TemplateResponse<Http::STATUS_OK, string>
	 * 200: Show secret share page
	 */
	public function share(): TemplateResponse {
		Util::addScript(Application::APP_ID, 'redirect');

		return new TemplateResponse(Application::APP_ID, 'redirect', [], TemplateResponse::RENDER_AS_BASE);
	}
}
