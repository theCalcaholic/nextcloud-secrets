# SPDX-FileCopyrightText: Bernhard Posselt <dev@bernhard-posselt.com>
# SPDX-License-Identifier: AGPL-3.0-or-later

# Generic Makefile for building and packaging a Nextcloud app which uses npm and
# Composer.
#
# Dependencies:
# * make
# * which
# * curl: used if phpunit and composer are not installed to fetch them from the web
# * tar: for building the archive
# * pnpm: for building and testing everything JS
#
# If no composer.json is in the app root directory, the Composer step
# will be skipped. The same goes for the package.json which can be located in
# the app root or the js/ directory.
#
# The pnpm command by launches the pnpm build script:
#
#    pnpm run build
#
# The pnpm test command launches the pnpm test script:
#
#    pnpm run test
#
# The idea behind this is to be completely testing and build tool agnostic. All
# build tools and additional package managers should be installed locally in
# your project, since this won't pollute people's global namespace.
#

app_name=$(notdir $(CURDIR))
build_tools_directory=$(CURDIR)/build/tools
source_build_directory=$(CURDIR)/build/artifacts/source
source_package_name=$(source_build_directory)/$(app_name)
appstore_build_directory=$(CURDIR)/build/artifacts/appstore
appstore_package_name=$(appstore_build_directory)/$(app_name)
pnpm=$(shell which pnpm 2> /dev/null)
composer=$(shell which composer 2> /dev/null)

all: build

# Fetches the PHP and JS dependencies and compiles the JS. If no composer.json
# is present, the composer step is skipped, if no package.json or js/package.json
# is present, the pnpm step is skipped
.PHONY: build
build:
ifneq (,$(wildcard $(CURDIR)/composer.json))
	make composer
endif
ifneq (,$(wildcard $(CURDIR)/package.json))
	make npm
endif
ifneq (,$(wildcard $(CURDIR)/js/package.json))
	make npm
endif

# Installs and updates the composer dependencies. If composer is not installed
# a copy is fetched from the web
.PHONY: composer
composer:
ifeq (, $(composer))
	@echo "No composer command available, downloading a copy from the web"
	mkdir -p $(build_tools_directory)
	curl -sS https://getcomposer.org/installer | php
	mv composer.phar $(build_tools_directory)
	php $(build_tools_directory)/composer.phar install --prefer-dist
	php $(build_tools_directory)/composer.phar exec generate-spec
else
	composer install --prefer-dist
	#composer exec generate-spec
endif

# Installs npm dependencies
.PHONY: npm
npm:
ifeq (,$(wildcard $(CURDIR)/package.json))
	cd js && $(pnpm) run build
else
	pnpm run build
endif
	cp -R js-static/* js/

# Removes the appstore build
.PHONY: clean
clean:
	rm -rf ./build

# Same as clean but also removes dependencies installed by composer, bower and
# npm
.PHONY: distclean
distclean: clean
	rm -rf vendor
	rm -rf node_modules
	rm -rf js/vendor
	rm -rf js/node_modules

# Builds the source and appstore package
.PHONY: dist
dist:
	make source
	make appstore

# Builds the source package
.PHONY: source
source:
	rm -rf $(source_build_directory)
	mkdir -p $(source_build_directory)
	tar --exclude="$(source_package_name).tar.gz" \
	--exclude-vcs \
	--exclude="../$(app_name)/build" \
	--exclude="../$(app_name)/js/node_modules" \
	--exclude="../$(app_name)/node_modules" \
	--exclude="../$(app_name)/*.log" \
	--exclude="../$(app_name)/js/*.log" \
	-cvzf $(source_package_name).tar.gz \
	../$(app_name)

# Builds the source package for the app store, ignores php and js tests
.PHONY: appstore
appstore:
	rm -rf $(appstore_build_directory)
	mkdir -p $(appstore_build_directory)
	tar \
		--exclude-vcs \
		--exclude="../$(app_name)/js/*.map" \
		-cvzf $(appstore_package_name).tar.gz \
		../$(app_name)/appinfo \
		../$(app_name)/img \
		../$(app_name)/js \
		../$(app_name)/css \
		../$(app_name)/lib \
		../$(app_name)/l10n \
		../$(app_name)/LICENSES \
		../$(app_name)/templates \
		../$(app_name)/LICENSE.md

.PHONY: test
test: composer
	$(CURDIR)/vendor/bin/phpunit -c phpunit.xml
	$(CURDIR)/vendor/bin/phpunit -c phpunit.integration.xml

.PHONY: openapi
openapi:
	sed -i -e 's/private function authenticateX[(]/final public function authenticate(/' lib/Controller/SecretShareController.php
	composer require --dev nextcloud/openapi-extractor
	composer exec generate-spec . ./openapi.json
	sed -i -e 's/final public function authenticate[(]/private function authenticateX(/' lib/Controller/SecretShareController.php
