<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Create your routes in here. The name is the lowercase name of the controller
 * without the controller part, the stuff after the hash is the method.
 * e.g. page#index -> OCA\Secrets\Controller\PageController->index()
 *
 * The controller class has to be registered in the application.php file since
 * it's instantiated in there
 */
return [
	'routes' => [
		['name' => 'page#index', 'url' => '/', 'verb' => 'GET'],
		['name' => 'page#show', 'url' => '/s/{uuid}', 'verb' => 'GET'],
		['name' => 'secret#index', 'url' => '/secrets', 'verb' => 'GET'],
		['name' => 'secret#show', 'url' => '/secrets/{uuid}', 'verb' => 'GET'],
		['name' => 'secret#create', 'url' => '/secrets', 'verb' => 'POST'],
		['name' => 'secret#delete', 'url' => '/secrets/{uuid}', 'verb' => 'DELETE'],
		['name' => 'secret#updateTitle', 'url' => '/secrets/{uuid}/title', 'verb' => 'PUT'],

		['name' => 'SecretApi#getSecret', 'url' => '/api/get', 'verb' => 'POST'],

		['name' => 'SecretShare#showShare', 'root' => '/secret',
			'url' => '/show/{token}', 'verb' => 'GET'],
		['name' => 'SecretShare#showAuthenticate', 'root' => '/secret',
			'url' => '/show/{token}/authenticate/{redirect}', 'verb' => 'GET'],
		['name' => 'SecretShare#authenticate', 'root' => '/secret',
			'url' => '/show/{token}/authenticate/{redirect}', 'verb' => 'POST'],
	]
];
