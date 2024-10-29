#!/bin/bash -x

function is_bin_in_path {
  builtin type -P "$1" &> /dev/null
}

! is_bin_in_path node && echo "Please install ko" && exit 1

export APP=khanmigogo

# Repository -
#   A collection of tags grouped under a common prefix (the name component before :).
#   For example, in an image tagged with the name my-app:3.1.4, my-app is the Repository component of the name.
#   A repository name is made up of slash-separated name components, optionally prefixed by the service's DNS hostname.
#   The hostname must follow comply with standard DNS rules, but may not contain _ characters.
#   If a hostname is present, it may optionally be followed by a port number in the format :8080.
#   Name components may contain lowercase characters, digits, and separators.
#   A separator is defined as a period, one or two underscores, or one or more dashes.
#   A name component may not start or end with a separator.
#
#
# Tag -
#   A tag serves to map a descriptive, user-given name to any single image ID.
#
# Image Name -
#   Informally, the name component after any prefixing hostnames and namespaces.
#
# WARNING: A docker tag name must be valid ASCII and may contain lowercase and uppercase letters,
# digits, underscores, periods and dashes.
# A docker tag name may not start with a period or a dash and may contain a maximum of 128 characters.

export PROJECT=khan-academy
export IMAGE_NAME=${APP}
export REPOSITORY_NAMESPACE=${PROJECT}
export REGISTRY=docker.io
export REPOSITORY=${REGISTRY}/${REPOSITORY_NAMESPACE}/${IMAGE_NAME}
export KO_DOCKER_REPO=${REPOSITORY}
export GOPRIVATE=github.com/Khan
export GO111MODULE=on
export COMMIT_SHA=$(git rev-parse HEAD)
export VERSION=v0.0.0
export BUILD_DATE=$(date +'%s')
ko publish --sbom=none --bare --platform=linux/amd64 . -t "${COMMIT_SHA}"