<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\SimpleMigrationStep;
use OCP\Migration\IOutput;

class Version000000Date20181013124731 extends SimpleMigrationStep {
	/**
	 * @param IOutput $output
	 * @param Closure $schemaClosure The `\Closure` returns a `ISchemaWrapper`
	 * @param array $options
	 * @return null|ISchemaWrapper
	 */
	public function changeSchema(IOutput $output, Closure $schemaClosure, array $options) {
		/** @var ISchemaWrapper $schema */
		$schema = $schemaClosure();

		if (!$schema->hasTable('secrets')) {
			$table = $schema->createTable('secrets');
			$table->addColumn('id', Types::INTEGER, [
				'autoincrement' => true,
				'notnull' => true,
			]);
			$table->addColumn('uuid', Types::STRING, [
				'notnull' => true,
				'length' => 32
			]);
			$table->addColumn('title', Types::STRING, [
				'notnull' => false,
				'length' => 200
			]);
			$table->addColumn('user_id', Types::STRING, [
				'notnull' => true,
				'length' => 200,
			]);
			$table->addColumn('encrypted', Types::BLOB, [
				'notnull' => false,
				'default' => null
			]);
			$table->addColumn('iv', Types::BLOB, [
				'notnull' => false,
				'default' => null
			]);
			$table->addColumn('expires', Types::DATE, [
				'notnull' => false,
				'default' => null,
			]);
			$table->addColumn('pw_hash', Types::STRING, [
				'notnull' => false,
				'length' => 64,
				'default' => null
			]);

			$table->setPrimaryKey(['id']);
			$table->addIndex(['user_id'], 'secrets_user_id_index');
		}
		return $schema;
	}
}
