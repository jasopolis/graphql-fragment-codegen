#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import getStdin from 'get-stdin'
import { graphql, parse, buildASTSchema, getIntrospectionQuery } from 'graphql'

const log = (x) => (console.trace(x), x)

// Turns an array of objects into an object indexed by a given field.
function index(array, field) {
    const index = {}
    array.forEach((item) => {
        index[item[field]] = item
    })
    return index
}

function indentedLine(level) {
    let line = '\n'
    for (let i = 0; i < level; i++) {
        line += '  '
    }
    return line
}

async function introspect(schemaContents) {
    const schema = buildASTSchema(parse(schemaContents))
    const introspectionQuery = getIntrospectionQuery()
    return await graphql({ schema, source: introspectionQuery })
}

function makeFragments(schemaContents) {
    const schema = schemaContents.data.__schema
    const types = schema.types.filter(
        ({ kind, name }) =>
            kind === 'OBJECT' &&
            !name.startsWith('__') &&
            name !== schema.queryType.name &&
            name !== schema.mutationType.name
    )
    const typesByName = index(types, 'name')
    const definitions = types
        .filter(
            ({ kind, name }) =>
                kind === 'OBJECT' &&
                !name.startsWith('__') &&
                name !== schema.queryType.name
        )
        .map((type) => {
            const { name, fields } = type
            return {
                name,
                fragment: `fragment ${name} on ${name} {
  ${fields
      .map((field) => printField(field, typesByName))
      // Some fields should not be printed, ie. fields with arguments.
      // Remove those from the output by returning null from printField.
      .filter((field) => field != null)
      .join(indentedLine(1))}
}
`,
            }
        })
    return `// This file was auto-generated by graphql-fragment-codegen. Do not edit it by hand.
${definitions
    .map(
        ({ name, fragment }) => `
export const ${name} = \`${fragment}\`
`
    )
    .join('')}`
}

function printField(field, typesByName, indent = 1) {
    const { name, type } = field
    if ('args' in field && field.args.length > 0) {
        return null
    }
    // if (type.kind === 'NON_NULL') {
    //     console.error('non-null: ', name, type)
    //     return null
    // }
    if (type.kind === 'SCALAR') {
        return name
    }
    if (type.kind === 'OBJECT') {
        return (
            name +
            ' {' +
            indentedLine(indent + 1) +
            typesByName[type.name].fields
                .map((field) => printField(field, typesByName, indent + 1))
                .filter((field) => field != null)
                .join(indentedLine(indent + 1)) +
            indentedLine(indent) +
            '}'
        )
    }
    if (type.kind === 'LIST') {
        return printField({ ...field, type: type.ofType }, typesByName)
    }
    console.error('unmatched type kind: ', type.kind)
    return null
}

async function main() {
    const stdin = await getStdin()
    if (stdin === '') {
        process.exit(1)
    }
    const schemaContents = await introspect(stdin)
    process.stdout.write(makeFragments(schemaContents))
}
main()
