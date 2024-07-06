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
		[
			'name' => 'page#index',
			'url' => '/',
			'verb' => 'GET'
		],
		[
			'name' => 'page#show',
			'url' => '/s/{uuid}',
			'verb' => 'GET'
		],

		[
			'name' => 'SecretShare#showShare',
			'url' => '/share/{token}',
			'verb' => 'GET'
		],
		[
			'name' => 'SecretShare#showAuthenticate',
			'url' => '/share/{token}/authenticate/{redirect}',
			'verb' => 'GET'
		],
		[
			'name' => 'SecretShare#authenticate',
			'url' => '/share/{token}/authenticate/{redirect}',
			'verb' => 'POST'
		],
		[
			'name' => 'Redirect#share',
			'url' => '/show/{token}',
			'verb' => 'GET'
		]
	],
	'ocs' => [
		['name' => 'secretApi#getAll', 'url' => '/api/v1/secrets', 'verb' => 'GET'],
		['name' => 'secretApi#createSecret', 'url' => '/api/v1/secrets', 'verb' => 'POST'],
		['name' => 'secretApi#get', 'url' => '/api/v1/secrets/{uuid}', 'verb' => 'GET'],
		['name' => 'secretApi#delete', 'url' => '/api/v1/secrets/{uuid}', 'verb' => 'DELETE'],
		['name' => 'secretApi#updateTitle', 'url' => '/api/v1/secrets/{uuid}/title', 'verb' => 'PUT'],
		[
			'name' => 'secretApi#retrieveSharedSecret',
			'url' => '/api/v1/share',
			'verb' => 'POST',
			'defaults' => ['password' => null]
		],
		['name' => 'secretApi#getVersion', 'url' => '/version', 'verb' => 'GET']
	]
];
