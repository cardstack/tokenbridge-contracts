#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit
node_modules/.bin/truffle version

echo "== Compiling"
npx truffle compile

echo "== Running tests"
npx truffle test --network ganache "$@"
