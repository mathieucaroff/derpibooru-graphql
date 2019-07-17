# Derpibooru GraphQL API

Built on top of the Rest API

## Trying out the library

These steps will allow you to run graphql in the GraphQL Playground.

1. Clone the repository

```bash
git clone ...
cd ...
```

2. Install dependencies

With yarn:

```bash
yarn install
yarn tsc
yarn playground
```

With npm:

```bash
npm install
npm run compile
npm run playground
```

3. Go to localhose:4000/playground

## Using the library in your project

Install with `npm install --save derpiboru-graphql node-fetch`
or `yarn add derpiboru-graphql node-fetch`

Then use:

```js
import * as fetch from 'node-fetch'
import { default as DerpibooruGraphql } from 'derpibooru-graphql'

let { gql, query } = new DerpibooruGraphql({ fetch })

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
```
