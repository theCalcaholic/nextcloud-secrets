// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

import fs from 'fs'
import { randomUUID } from 'node:crypto'
import { chmodSync, cpSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'

/**
 *
 * @param dir
 */
async function* dirWalk(dir: string): AsyncGenerator<string> {
	for await (const d of await fs.promises.opendir(dir)) {
		const entry = path.join(dir, d.name)
		if (d.isDirectory()) {
			yield entry
			yield* dirWalk(entry)
		} else if (d.isFile()) {
			yield entry
		}
	}
}

/**
 *
 * @param src
 * @param dest
 * @param excludes
 */
export async function syncApp(src: string, dest: string, excludes: string[]): Promise<string> {
	// rmSync(dest, { recursive: true, force: true })
	const tmpPrefix = randomUUID()
	const tmpDir = `/tmp/${tmpPrefix}/secrets`
	mkdirSync(dest, { recursive: true })
	mkdirSync(tmpDir, { recursive: true })
	chmodSync(tmpDir, 0o774)
	cpSync(src, tmpDir, {
		recursive: true,
		force: true,
		filter: (item) => excludes.find((exclude) => item.startsWith(exclude)) === undefined,
	})
	cpSync(tmpDir, dest, {
		recursive: true,
		force: true,
	})
	rmSync(tmpDir, {
		force: true,
		recursive: true,
	})
	chmodSync(dest, 0o0775)
	for await (const f of dirWalk(dest)) {
		if (fs.statSync(f).isDirectory()) {
			chmodSync(f, 0o0775)
		} else {
			chmodSync(f, 0o0774)
		}
	}
	return dest
}
