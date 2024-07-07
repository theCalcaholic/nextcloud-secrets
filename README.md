<!--
SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
SPDX-License-Identifier: CC0-1.0
-->

# Secrets

*Securely share data with anyone. All data is end-to-end encrypted by the user and will be deleted once retrieved successfully*

![screenshot](./screenshots/share_link.png)

Get it from the [Nextcloud app store](https://apps.nextcloud.com/apps/secrets)

## Cli

Secrets offers a command line tool that allows the creation and retrieval (not implemented yet) of secrets without a web browser.
It's available from the [github releases](https://github.com/thecalcaholic/nextcloud-secrets/releases).

### Usage

```sh
Usage: nc-secrets [options] [command]

cli for https://apps.nextcloud.com/apps/secrets

Options:
  -k, --insecure                                         Disable SSL certificate validation (FOR TESTING ONLY)
  -h, --help                                             display help for command

Commands:
  create [options] <nextcloud-url> <user> <secret-file>  Create a new secret
  help [command]                                         display help for command
```

More details [here](./cli/README.md).

## Development

### Building the app

The app can be built by using the provided Makefile by running:

```sh
make
```

This requires the following things to be present:
* make
* which
* tar: for building the archive
* curl: used if phpunit and composer are not installed to fetch them from the web
* npm: for building and testing everything JS, only required if a package.json is placed inside the **js/** folder

The make command will install or update Composer dependencies and also **npm run build**.

## Publish to App Store

First get an account for the [App Store](http://apps.nextcloud.com/) then run:

    make && make appstore

The archive is located in build/artifacts/appstore and can then be uploaded to the App Store.

## Running tests
You can use the provided Makefile to run all tests by using:

    make test

This will run the PHP unit and integration tests and if a package.json is present in the **js/** folder will execute **npm run test**

Of course you can also install [PHPUnit](http://phpunit.de/getting-started.html) and use the configurations directly:

    phpunit -c phpunit.xml

or:

    phpunit -c phpunit.integration.xml

for integration tests

## Generating OpenAPI specification

This command will generate a file namd openapi.json which contains the documentation for the app's API endpoints. 

```sh
compose exec generate-spec
```

This command is not included in make, due to [this bug with Nextcloud's openapi-extractor](https://github.com/nextcloud/openapi-extractor/issues/28)
and therefore needs to be run manually before release.
