#!/usr/bin/env bash
# TODO: add unions and interfaces to tests
diff <(./index.js < test/types.graphql) test/expected.graphql && exit 0 || exit 1
