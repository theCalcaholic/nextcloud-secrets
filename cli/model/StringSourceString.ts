// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { StringSource } from './StringSource.ts'

export class StringSourceString implements StringSource {
	private readonly plaintext: string

	constructor(plaintext: string) {
		this.plaintext = plaintext
	}

	async read() {
		return Promise.resolve(this.plaintext)
	}
}
