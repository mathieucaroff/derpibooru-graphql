# Derpibooru GraphQL API

Built on top of the Rest API

## Trying out the library

```bash
git clone ...
cd ...
yarn install
yarn tsc
yarn serve
```

This will allow you to run graphql in the GraphQL Playground.

## Using the library in your project

```js
import * as DerpibooruGraphql from 'derpibooru-graphql'

let {
    gql,
    query,
    executableSchema,
    schema,
    schemaText,
} = new DerpibooruGraphql()

// The recommanded way: use the gql tag //
let variables = {}
let result = await gql`
    query {
        search(query: "cute", per_page: 50) {
            total
            search {
                faves
                file_name
                score
                representations {
                    full
                }
            }
        }
    }
`(varialbles)

console.log(result)

// If you like to have your queries in separate files, use the query function //
// let graphqlQueryText = await fs.promises.readFile('derpiboru-query.gql', 'utf-8')
let graphqlQueryText = `
query {
    search(query: "cute", per_page: 50) {
        total
        search {
            faves
            file_name
            score
            representations {
                full
            }
        }
    }
}
`

expect(await query(graphqlQueryText)).toEqual(result)

import { graphql, buildSchema } from 'graphql'

// If you have an already build GraphQL schema, use executableSchema //
let graphqlQuery = buildSchema(graphqlQueryText)
expect(await graphql(executableSchema, graphqlQuery)).toEqual(result)
```
