# graphql-fragment-codegen

Generates fragments that contain all of the fields in a GraphQL type.
Useful for eg. pre-fetching detail views in list queries, or for offline use.

# Install

```
npm install -g graphql-fragment-codegen
```

# Usage

```
graphql-fragment-codegen < path/to/input/schema.graphql > path/to/output/fragments.js
```

# Example

Given the following schema:

```graphql
schema {
  query: Query
}

type Query {
  foo: Foo
  bar: Bar
  baz: String
}

type Foo {
  someField: Int
  otherField: String
}

type Bar {
  yay: Boolean
  ok: Boolean
}
```

...it generates:

```js
// This file was auto-generated by fragment-codegen. Do not edit it by hand.

export const Foo = `fragment Foo on Foo {
  someField
  otherField
}
`

export const Bar = `fragment Bar on Bar {
  yay
  ok
}
`
```

You can then use the resulting fragment in queries as follows:

```js
import * as fragments from './fragments'

// ...
gql`
  query SomeQuery {
    foo {
      ...Foo
    }
  }
  ${fragments.Foo}
`
// ...

```
