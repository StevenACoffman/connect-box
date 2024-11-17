#!/bin/bash

function is_bin_in_path {
  builtin type -P "$1" &> /dev/null
}

! is_bin_in_path node && echo "Please install node" && exit 1
! is_bin_in_path yarn && echo "Please install yarn" && exit 1
! is_bin_in_path go && echo "Please install golang" && exit 1
! is_bin_in_path tsc && echo "Please install typescript" && exit 1

cd ui
yarn install
cd ..
export PATH="$PWD/ui/node_modules/.bin:$PATH"
# should be in node modules
! is_bin_in_path buf && go install github.com/bufbuild/buf/cmd/buf@latest
! is_bin_in_path protoc-gen-go && go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
! is_bin_in_path protoc-gen-connect-go && go install connectrpc.com/connect/cmd/protoc-gen-connect-go@latest

buf build
buf generate
echo "Run ./run.sh and then browse on http://localhost:8080"