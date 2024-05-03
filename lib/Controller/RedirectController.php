<?php

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
	public function share()
	{
		Util::addScript(Application::APP_ID, 'redirect');

		return new TemplateResponse(Application::APP_ID, 'redirect', [], TemplateResponse::RENDER_AS_BASE);
	}
}
