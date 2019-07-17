// Type
import { Fetch } from './type'

// JS
import { promises as fs } from 'fs'
import { buildSchema, printSchema } from 'graphql'

import { populateResolvers, stripDirectives } from './step'

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

class DerpibooruGraphql {
   prop: {
      fetch: Fetch
   }
   constructor(prop) {
      this.prop = prop
   }
   get annotatedSchemaText() {
      return cached(async () => {
         return await fs.readFile(`${__dirname}/main.ts`, 'utf-8')
      })
   }
   get annotatedSchema() {
      return cached(async () => {
         return buildSchema(await this.annotatedSchemaText)
      })
   }
   get schema() {
      return cached(async () => {
         return stripDirectives(await this.annotatedSchema)
      })
   }
   get schemaText() {
      return cached(async () => {
         return printSchema((await this.schema) as any)
      })
   }
   get executableSchema() {
      return cached(async () => {
         let schema = await this.annotatedSchemaText
         return populateResolvers(schema, this.prop.fetch)
      })
   }
   get all() {
      return (async () => ({
         annotatedSchemaText: await this.annotatedSchemaText,
         annotatedSchema: await this.annotatedSchema,
         schema: await this.schema,
         schemaText: await this.schemaText,
         executableSchema: await this.executableSchema,
      }))()
   }
}

export { DerpibooruGraphql }
