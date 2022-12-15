<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Db;

use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Db\MultipleObjectsReturnedException;
use OCP\AppFramework\Db\QBMapper;
use OCP\DB\Exception;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

/**
 * @template-extends QBMapper<Note>
 */
class SecretMapper extends QBMapper {
	public function __construct(IDBConnection $db) {
		parent::__construct($db, 'secrets', Secret::class);
	}

	/**
	 * @throws MultipleObjectsReturnedException
	 * @throws DoesNotExistException
	 */
	public function find(string $uuid, string $userId): Secret {
		/* @var $qb IQueryBuilder */
		$qb = $this->db->getQueryBuilder();
		$qb->select('*')
			->from('secrets')
			->where($qb->expr()->eq('uuid', $qb->createNamedParameter($uuid)))
			->andWhere($qb->expr()->eq('user_id', $qb->createNamedParameter($userId)));
		return $this->findEntity($qb);
	}

	/**
	 * @throws MultipleObjectsReturnedException
	 * @throws DoesNotExistException
	 */
	public function findById(int $id, string $userId): Secret {
		/* @var $qb IQueryBuilder */
		$qb = $this->db->getQueryBuilder();
		$qb->select('*')
			->from('secrets')
			->where($qb->expr()->eq('id', $qb->createNamedParameter($id)))
			->andWhere($qb->expr()->eq('user_id', $qb->createNamedParameter($userId)));
		return $this->findEntity($qb);
	}

	/**
	 * @throws MultipleObjectsReturnedException
	 * @throws DoesNotExistException
	 */
	public function findPublic(string $uuid): Secret {
		/* @var $db IQueryBuilder */
		$qb = $this->db->getQueryBuilder();
		$qb->select('*')
			->from('secrets')
			->where($qb->expr()->eq('uuid', $qb->createNamedParameter($uuid)))
			->andWhere($qb->expr()->isNotNull('encrypted'))
			->andWhere($qb->expr()->gt('expires', $qb->createNamedParameter(date("Y-m-d"))));
		return $this->findEntity($qb);
	}

	/**
	 * @param string $uuid
	 * @return Secret
	 * @throws DoesNotExistException
	 * @throws MultipleObjectsReturnedException
	 * @throws Exception
	 */
	public function invalidate(string $uuid): Secret {
		$qb = $this->db->getQueryBuilder();
		$qb->select('*')
			->from('secrets')
			->where($qb->expr()->eq('uuid', $qb->createNamedParameter($uuid)))
			->andWhere($qb->expr()->isNotNull('encrypted'));
		$secret = $this->findEntity($qb);
		$secret->setEncrypted(null);
		$secret->setIv(null);
		$secret->setExpires(date('Y-m-d'));
		return $this->update($secret);
	}

	/**
	 * @throws Exception
	 */
	public function deleteExpired(string $date): void {
		$qb = $this->db->getQueryBuilder();
		$qb->delete($this->tableName)
			->where(
				$qb->expr()->lt('expires', $qb->createNamedParameter($date))
			);
		$qb->executeStatement();
	}

	/**
	 * @throws DoesNotExistException
	 * @throws MultipleObjectsReturnedException
	 */
	public function getId(string $uuid): int {
		/* @var $db IQueryBuilder */
		$qb = $this->db->getQueryBuilder();
		$qb->select('id')
			->from('secrets')
			->where($qb->expr()->eq('uuid', $qb->createNamedParameter($uuid)));
		return $this->findOneQuery($qb)['id'];
	}

	/**
	 * @param string $userId
	 * @return array<Secret>
	 */
	public function findAll(string $userId): array {
		/* @var $qb IQueryBuilder */
		$qb = $this->db->getQueryBuilder();
		$qb->select('*')
			->from('secrets')
			->where($qb->expr()->eq('user_id', $qb->createNamedParameter($userId)));
		return $this->findEntities($qb);
	}
}
