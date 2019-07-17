// Type
import { Fetch } from '../type'

// JS
import { readFileSync } from 'fs'
import {
   buildSchema,
   graphql,
   printSchema,
   Source,
   ExecutionResult,
} from 'graphql'

import { populateResolvers, stripDirectives } from '../step'
import ono from 'ono'
import { ExecutionResultDataDefault } from 'graphql/execution/execute'

let cached = (() => {
   let cache = {}
   return <T>(f: () => T): T => {
      let key = `${f}`
      if (!(key in cache)) {
         cache[key] = f()
      }
      return cache[key]
   }
})()

type QueryResult = ExecutionResult<ExecutionResultDataDefault>

class DerpibooruGraphql {
   prop: {
      fetch: Fetch
   }
   constructor(prop) {
      this.prop = prop
   }
   get annotatedSchemaText() {
      return cached(() => readFileSync('src/derpibooru-schema.gql', 'utf-8'))
   }
   get annotatedSchema() {
      return cached(() => buildSchema(this.annotatedSchemaText))
   }
   // get strippedSchema() {
   //    return cached(() => stripDirectives(this.annotatedSchema))
   // }
   // get strippedSchemaText() {
   //    return cached(() => printSchema(this.schema))
   // }
   get schema() {
      return cached(() => {
         let schema = this.annotatedSchemaText
         return populateResolvers(schema, this.prop.fetch)
      })
   }
   async query(source: Source | string): Promise<QueryResult> {
      return await graphql(this.schema, source)
   }
   gql = async (arr, ...args) => {
      let source = String.raw(arr, ...args)
      let result = await graphql(this.schema, source)
      return result
   }
   gqldata = async (arr, ...args) => {
      let { data, errors } = await this.gql(arr, ...args)
      if (errors) {
         throw ono('(derpibooruGraphql) <gql``> request failed', errors)
      }
      return data
   }
   get get_gql() {
      let { schema } = this
      return async (arr, ...args) => {
         let source = String.raw(arr, ...args)
         let result = await graphql(schema, source)
         return result
      }
   }
   get get_gqldata() {
      let { gql } = this
      return async (arr, ...args) => {
         let { data, errors } = await gql(arr, ...args)
         if (errors) {
            throw ono('(derpibooruGraphql) <gql``> request failed', errors)
         }
         return data
      }
   }
}

export { DerpibooruGraphql }
