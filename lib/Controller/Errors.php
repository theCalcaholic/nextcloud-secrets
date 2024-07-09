<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Controller;

use Closure;

use OCA\Secrets\Service\SecretNotFound;
use OCA\Secrets\Service\UnauthorizedException;
use OCP\AppFramework\Http;

use OCP\AppFramework\Http\DataResponse;

trait Errors {
	protected function handleNotFound(Closure $callback): DataResponse {
		try {
			return new DataResponse($callback());
		} catch (SecretNotFound $e) {
			$message = ['message' => $e->getMessage()];
			return new DataResponse($message, Http::STATUS_NOT_FOUND);
		}
	}

	protected function handleUnauthorized(Closure $callback): DataResponse {
		try {
			return new DataResponse($callback());
		} catch (UnauthorizedException $e) {
			$message = ['message' => $e->getMessage()];
			return new DataResponse($message, Http::STATUS_UNAUTHORIZED);
		}
	}

	protected function handleErrors(Closure $callback): DataResponse {
		try {
			return new DataResponse($callback());
		} catch (SecretNotFound $e) {
			$message = ['message' => $e->getMessage()];
			return new DataResponse($message, Http::STATUS_NOT_FOUND);
		} catch (UnauthorizedException $e) {
			$message = ['message' => $e->getMessage()];
			return new DataResponse($message, Http::STATUS_UNAUTHORIZED);
		}
	}
}
