NODE_VERSION ?=$(shell grep FROM Dockerfile | cut -d ':' -f 2| cut -d '-' -f 1)

# We support two build modes , node-onbuild or alpine-node
BUILD_TYPE ?=node-onbuild

NAME_BUILD_CONTAINER ?=logentries-build-$(BUILD_TYPE)
NAME_TEST_CONTAINER ?=logentries-test-$(BUILD_TYPE)
NAME_EXPORT_CONTAINER ?=logentries-export-$(BUILD_TYPE)

DOCKER_REGISTRY_PREFIX ?=logentries/logentries
DOCKER_REGISTRY_IMAGE_TAG_VERSION ?=$(shell node -e "console.log(require('./package.json').version);")

# Use the alpine node 
ifeq ($(BUILD_TYPE),alpine-node)
DOCKERFILE_SUFFIX ?=.alpine
DOCKER_REGISTRY_IMAGE_TAG_PREFIX ?=alpine-
else
DOCKERFILE_SUFFIX ?=
DOCKER_REGISTRY_IMAGE_TAG_PREFIX ?=
endif

# Just a random token
LOGENTRIES_TOKEN ?=XAXAXAXAXA
WAIT_TIME ?=5

.PHONY: default
default: help

build: ## Builds a new docker image
	echo $(BUILD_TYPE)
	echo $(DOCKERFILE_SUFFIX)
	@echo "[build] Building new image"
	docker build --rm=true --tag=$(NAME_BUILD_CONTAINER) -f Dockerfile$(DOCKERFILE_SUFFIX) . 

test: ## Tests a previous build docker image to see if starts
	@echo "[test] Removing existing test container if any"
	@docker rm -f $(NAME_TEST_CONTAINER) > /dev/null 2>&1 || true
	@echo "[test] Starting a test container"
	@docker run -d --name=$(NAME_TEST_CONTAINER) \
		-v /var/run/docker.sock:/var/run/docker.sock \
  $(NAME_BUILD_CONTAINER) -t $(LOGENTRIES_TOKEN) -j -a host=$(NAME_TEST_CONTAINER)  > /dev/null 2>&1
	@echo "[test] Testing if the container stays running"
	@echo "[test] Waiting for $(WAIT_TIME) seconds"
	@sleep $(WAIT_TIME)
	@docker ps | grep $(NAME_TEST_CONTAINER) | wc -l
	@echo "[test] Cleaning up test container $(NAME_TEST_CONTAINER)"
	@docker rm -f $(NAME_TEST_CONTAINER) > /dev/null 2>&1 || true

tag: ## Tags a local build image to make it ready for push to docker registry
	docker tag -f $(shell docker images -q $(NAME_BUILD_CONTAINER)) $(DOCKER_REGISTRY_PREFIX):$(DOCKER_REGISTRY_IMAGE_TAG_PREFIX)$(DOCKER_REGISTRY_IMAGE_TAG_VERSION)


push: ## Push the local image to the docker registry
	docker push $(DOCKER_REGISTRY_PREFIX):$(DOCKER_REGISTRY_IMAGE_TAG_PREFIX)$(DOCKER_REGISTRY_IMAGE_TAG_VERSION)

export: ## Export the build as a tarball
	-docker rm -f $(NAME_EXPORT_CONTAINER)
	docker create --name $(NAME_EXPORT_CONTAINER) $(NAME_BUILD_CONTAINER)
	docker export -o logentries-$(DOCKER_REGISTRY_IMAGE_TAG_PREFIX)$(DOCKER_REGISTRY_IMAGE_TAG_VERSION).tar `docker ps -a -q -f 'name=$(NAME_EXPORT_CONTAINER)'`

help: ## Shows help
	@echo "================================================================================================="
	@echo "support build types are:"
	@echo "- BUILD_TYPE=node-onbuild (default)"
	@echo "- BUILD_TYPE=alpine-node"
	@echo ""
	@echo "set the environment accordingly to change the build type"
	@echo "================================================================================================="
	@IFS=$$'\n' ; \
    help_lines=(`fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//'`); \
    for help_line in $${help_lines[@]}; do \
        IFS=$$'#' ; \
        help_split=($$help_line) ; \
        help_command=`echo $${help_split[0]} | sed -e 's/^ *//' -e 's/ *$$//'` ; \
        help_info=`echo $${help_split[2]} | sed -e 's/^ *//' -e 's/ *$$//'` ; \
        printf "%-30s %s\n" $$help_command $$help_info ; \
    done

