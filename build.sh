#!/bin/bash

function is_bin_in_path {
  builtin type -P "$1" &> /dev/null
}

! is_bin_in_path node && echo "Please install node" && exit 1
! is_bin_in_path yarn && echo "Please install yarn" && exit 1
! is_bin_in_path go && echo "Please install golang" && exit 1
! is_bin_in_path tsc && echo "Please install typescript" && exit 1

cd ui
# src/useClient.ts has incorrect url for prod deploy
sed -i.bak -e "s/.*baseUrl.*/    baseUrl: prod_base_url,/" ./src/useClient.ts
rm ./src/useClient.ts.bak
yarn build
sed -i.bak -e "s/.*baseUrl.*/    baseUrl: dev_base_url,/" ./src/useClient.ts
rm ./src/useClient.ts.bak
cd ..
# build docker image
#./ko.sh