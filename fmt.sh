#!/bin/bash
gci write -s standard -s default -s "prefix(github.com/Khan)" --skip-generated .
golines --shorten-comments --base-formatter=gofumpt -w .