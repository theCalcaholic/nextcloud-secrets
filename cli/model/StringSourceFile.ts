// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { StringSource } from './StringSource.ts'

import * as fs from 'fs'

export class StringSourceFile implements StringSource {
	private readonly filePath: string
	constructor(filePath: string) {
		this.filePath = filePath
	}

	async read() {
		return Promise.resolve(fs.readFileSync(this.filePath, 'utf-8'))
	}
}
