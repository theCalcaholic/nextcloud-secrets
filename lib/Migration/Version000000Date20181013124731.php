<?php
declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
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
			$table->addColumn('id', 'integer', [
				'autoincrement' => true,
				'notnull' => true,
			]);
			$table->addColumn('uuid', 'string', [
				'notnull' => true,
				'length' => 32
			]);
			$table->addColumn('title', 'string', [
				'notnull' => false,
				'length' => 200
			]);
			$table->addColumn('user_id', 'string', [
				'notnull' => true,
				'length' => 200,
			]);
			$table->addColumn('encrypted', 'blob', [
				'notnull' => false,
				'default' => null
			]);
			$table->addColumn('iv', 'blob', [
				'notnull' => false,
				'default' => null
			]);
			$table->addColumn('expires', 'date', [
				'notnull' => false,
				'default' => null,
			]);
			$table->addColumn('pw_hash', 'string', [
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
