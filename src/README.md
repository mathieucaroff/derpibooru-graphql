# Overview

## Conversions

Dump File
V
Dump object structure (step: validation, assertDump)
V (flattening)
Dense object structure
V
Entry Map, Model Map, Query

Model Map, Query
V (model -> graphql type)
Type Map
V
GraphQL Schema

## Generation

Type Map, Entry Map
V (step: resolverObj)
Resolvers

## Steps

Validation:
Ensuring that the structure of the dump has all fields it's supposed to have and
no more.

AssertDumpJson:
Exploring the dump to see if it is coherent.

Serve:
Start the GraphQl server

ResolverObj:
Produce the GraphQl resovlers

QueryType:
Produce the GraphQl `Query` type

QueryResolver:
Produce the GraphQl resovers for the Query type
