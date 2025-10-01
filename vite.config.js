// SPDX-FileCopyrightText: Nextcloud contributors
// SPDX-License-Identifier: AGPL-3.0-or-later
import { createAppConfig } from '@nextcloud/vite-config'
import { join, resolve } from 'path'
import cleanPlugin from 'vite-plugin-clean'
import { viteStaticCopy } from "vite-plugin-static-copy";

export default createAppConfig(
    {
        main: resolve(join('src', 'main.js')),
        public: resolve(join('src', 'public.js')),
    }, {
        createEmptyCSSEntryPoints: true,
        extractLicenseInformation: true,
        thirdPartyLicense: false,
        build: {
            cssCodeSplit: false
        },
        config: {
            plugins: [
                cleanPlugin,
                viteStaticCopy({
                    targets: [{
                        src: 'js-static/*.js',
                        dest: 'js'
                    }]
                })
            ],
        },
    }
)