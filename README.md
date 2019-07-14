# Deskpro GraphQL API

Built on top of the Rest API

## Getting started

```bash
yarn install
mkdir -p tmp
curl 'PATH_TO_DUMP_FILE.json' > tmp/dp.api.yml
yarn compile
yarn serve
```

## Test request

Filters now work.

```gql
{
    AB: people_get(count: 4, organization: "15,36,54") {
        id
        organization {
            id
        }
    }
    B: people_get(count: 2, page: 2, organization: "15,36,54") {
        id
        organization {
            id
        }
    }
}
```

## Unordered list of steps to convert the dump into graphQL AST and resolver

-   (Parse the JSON content)
-   Flattening the dump and adding default values where possible
-   ... todo
