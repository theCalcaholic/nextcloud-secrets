// SPDX-FileCopyrightText: Tobias Knöppler <tobias@knoeppler.org>
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { StringSource } from './StringSource.ts'

import { prompt } from '../lib.ts'

export class StringSourcePrompt implements StringSource {
	private readonly prompt: string
	constructor(prompt: string) {
		this.prompt = prompt
	}

	async read() {
		return prompt(this.prompt)
	}
}
