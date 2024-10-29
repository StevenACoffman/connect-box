#!/bin/bash
cd ui
yarn install
yarn build
cd ..
go run main.go