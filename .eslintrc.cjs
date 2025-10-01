// SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
// SPDX-License-Identifier: AGPL-3.0-or-later
module.exports = {
    globals: {
        appVersion: true
    },
    parserOptions: {
        requireConfigFile: false
    },
    extends: [
        '@nextcloud',
    ],
    rules: {
        'jsdoc/require-jsdoc': 'off',
        'vue/first-attribute-linebreak': 'off',
        'jsdoc/tag-lines': 'off',
        'import/extensions': 'off'
    },
}