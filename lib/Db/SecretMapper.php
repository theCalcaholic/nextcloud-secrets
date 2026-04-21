<?php

declare(strict_types=1);
// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

namespace OCA\Secrets\Db;

use OCA\Secrets\Service\NotificationService;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Db\MultipleObjectsReturnedException;
use OCP\AppFramework\Db\QBMapper;
use OCP\DB\Exception;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;
use Psr\Log\LoggerInterface;

/**
 * @template-extends QBMapper<Note>
 */
class SecretMapper extends QBMapper {
	private LoggerInterface $logger;
	private NotificationService $notifications;

	public function __construct(IDBConnection $db, LoggerInterface $logger, NotificationService $notifications) {
		$this->logger = $logger;
		$this->notifications = $notifications;
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
			->andWhere($qb->expr()->gt('expires', $qb->createNamedParameter(date('Y-m-d'))));
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
		$param = $qb->createNamedParameter($date);
		$qb->delete($this->tableName)
			->where($qb->expr()->lt('expires', $param));
		$this->logger->debug("Deleting expired secrets: '" . $qb->getSQL() . "', param = '" . $date . "'");
		$qb->executeStatement();
	}

	/**
	 * @throws Exception
	 */
	public function expire(string $referenceDate): void {
		$this->logger->debug('EXPIRE SECRETS UP TO ' . $referenceDate);
		$qb = $this->db->getQueryBuilder();
		$Param = $qb->createNamedParameter($referenceDate);
		$qb->select('*')
			->from('secrets')
			->where($qb->expr()->lt('expires', $Param))
			->andWhere($qb->expr()->isNotNull('encrypted'));
		$toExpire = $this->findEntities($qb);
		$toExpireIds = [];
		foreach ($toExpire as $secret) {
			$this->notifications->notifyExpired($secret);
			$toExpireIds[] = $secret->getId();
		}

		if (count($toExpireIds) > 0) {
			$this->logger->debug('to expire: [' . join(', ', $toExpireIds) . ']');
			$qb = $this->db->getQueryBuilder();
			$nullParam = $qb->createNamedParameter(null, IQueryBuilder::PARAM_STR);
			$expireIdsParam = $qb->createNamedParameter($toExpireIds, IQueryBuilder::PARAM_INT_ARRAY);
			$qb->update($this->tableName)
				->set('encrypted', $nullParam)
				->set('is_expired', $qb->createNamedParameter(true, IQueryBuilder::PARAM_BOOL))
				->where(
					$qb->expr()->andX(
						$qb->expr()->in('id', $expireIdsParam),
						$qb->expr()->isNotNull('encrypted')
					)
				);
			$this->logger->debug("Deleting expired secrets: '" . $qb->getSQL() . "'");
			$qb->executeStatement();
		}
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
