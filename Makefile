i18n = ./src/i18n

build:
	rm -rf ./dist
	./node_modules/.bin/tsc -p tsconfig.build.json

precommit:
	npm run lint
	npm audit

requirements:
	npm ci

i18n.extract:
	# Pulling display strings from source files into $(i18n)/transifex_input.json...
	mkdir -p $(i18n)
	npm run-script i18n_extract

extract_translations: | requirements i18n.extract

# Despite the name, we actually need this target to detect changes in the incoming translated message files as well.
detect_changed_source_translations:
	# Checking for changed translations...
	git diff --exit-code $(i18n)

# This target is used by Travis.
validate-no-uncommitted-package-lock-changes:
	# Checking for package-lock.json changes...
	git diff --exit-code package-lock.json
