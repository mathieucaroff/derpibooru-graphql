// Type
import { Fetch } from './type'

// JS
import { promises as fs } from 'fs'
import { buildSchema, print } from 'graphql'
import fetch from 'node-fetch'
import { populateResolvers, stripDirectives } from './step'

let f = (x): typeof x extends Array<any> ? void : [never] => {
    if (x instanceof Array) return
    throw new Error('not an Array')
}

f(2)

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
            return print((await this.schema) as any)
        })
    }
    get executableSchema() {
        return cached(async () => {
            return populateResolvers(
                await this.annotatedSchema,
                this.prop.fetch,
            )
        })
    }
}

export default { DerpibooruGraphql }
