#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const getStdin = require('get-stdin')
const { buildASTSchema, graphql, parse } = require('graphql')
const { introspectionQuery } = require('graphql/utilities')

async function introspect(schemaContents) {
  const schema = buildASTSchema(parse(schemaContents))
  return await graphql(schema, introspectionQuery)
}

function makeFragments(schemaContents) {
  const schema = schemaContents.data.__schema
  const types = schema.types
  return types
    .filter(
      ({ kind, name }) =>
        kind === 'OBJECT' &&
        !name.startsWith('__') &&
        name !== schema.queryType.name,
    )
    .map(type => {
      const { name, fields } = type
      return {
        name,
        fragment: `fragment ${name} on ${name} {
  ${fields.map(field => field.name).join('\n  ')}
}
`,
      }
    })
}

function makeFile(fragments) {
  return `// This file was auto-generated by fragment-codegen. Do not edit it by hand.
${fragments
    .map(
      ({ name, fragment }) => `
export const ${name} = \`${fragment}\`
`,
    )
    .join('')}`
}

async function main() {
  const stdin = await getStdin()
  const schemaContents = await introspect(stdin)
  process.stdout.write(makeFile(makeFragments(schemaContents)))
}
main()
