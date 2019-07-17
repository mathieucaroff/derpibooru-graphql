// Types
import {
   GraphQLField,
   GraphQLFieldResolver,
   GraphQLObjectType,
   GraphQLResolveInfo,
} from 'graphql'

import { Fetch } from '../type'

// JS
import * as url from 'url'

import ono from 'ono'

import {
   SchemaDirectiveVisitor,
   makeExecutableSchema,
   ITypeDefinitions,
} from 'graphql-tools'

import { entries, fromEntries } from '../util'

let extract = <T>(keyList: string[], obj: Record<any, T>): [string, T][] => {
   return entries(obj).filter(([key, value]) => {
      return keyList.includes(key) && value !== undefined
   })
}

let concatSlash = (a, b) => {
   let right = +(a.slice(-1) === '/')
   let left = +(b[0] === '/')
   return a + [`/${b}`, b, b.slice(1)][right + left]
}

type GetValue = (
   parent: Record<any, any>,
   args: Record<any, any>,
   context: any,
   info: GraphQLResolveInfo,
) => string

type GetGetValue = (param: {
   name: string
   field: GraphQLField<any, any>
}) => GetValue

type Pair = [string, string]

type Resolver = GraphQLFieldResolver<Record<any, any>, any>
type UResolver = Resolver | undefined

type FromDirectiveProp = {
   fetch: Fetch
   config: {
      configUrlBase?: string
      configQueryStringAdditions: string[]
   }
}

let getFromDirective = (prop: FromDirectiveProp) => {
   class FromDirective extends SchemaDirectiveVisitor {
      name: string
      args: Record<string, any>

      extract(keyString: string) {
         return extract(keyString.split(' '), this.args)
      }
      extractConfig() {
         let configPairList: Pair[] = this.extract(
            'configUrlBase configQueryStringAdditions',
         )
         let newConfig = fromEntries(configPairList)
         return {
            ...prop.config,
            ...newConfig,
         }
      }
      getGetValue: GetGetValue = ({ name, field }) => (
         parent,
         args,
         context,
         info,
      ) => {
         let value = args[name]
         if (value === undefined) {
            value = (parent || {})[name]
         }
         if (value === undefined) {
            throw ono(
               `could not find "${name}" neither in args, nor in the parent JSON`,
               { field, args, parent },
            )
         }
         if (typeof value !== 'string' && typeof value !== 'number') {
            throw ono(`unexpected type`, { name, value })
         }
         return `${value}`
      }
      resolverFromRestParameter(field: GraphQLField<any, any>) {
         let restKeyList: Pair[] = this.extract('get delete patch post put')
         if (restKeyList.length > 1) {
            throw ono('Several rest parameters supplied', restKeyList, field)
         }
         if (restKeyList.length == 1) {
            let [[method, uriTemplate]] = restKeyList
            let partList = uriTemplate.split(/\b|\B(?=\W)/)
            let replaceList: { getValue: GetValue; regex: RegExp }[] = []

            partList.forEach((part, i) => {
               if (part === ':') {
                  let name = partList[i + 1]
                  if (name !== undefined && name !== '') {
                     let getValue = this.getGetValue({ name, field })
                     replaceList.push({
                        getValue,
                        regex: new RegExp(`:${name}\\b`, 'g'),
                     })
                  }
               }
            })

            let resolver: Resolver = async (s, a, c, i) => {
               try {
                  let args = a
                  if (args.length) {
                     console.log({ args, thargs: this.args })
                  }
                  let uri = uriTemplate
                  replaceList.forEach(({ getValue, regex }) => {
                     let value = getValue(s, args, c, i)
                     uri = uri.replace(regex, value)
                  })
                  let concatUrl = concatSlash(prop.config.configUrlBase, uri)
                  let urlObj = new url.URL(concatUrl)
                  let qs = prop.config.configQueryStringAdditions
                  qs.forEach((param) => {
                     let [key, value] = param.split('=')
                     urlObj.searchParams.append(key, value)
                  })
                  let restResponse = await prop.fetch(urlObj.href, {
                     method: method.toUpperCase(),
                  })
                  let result = await restResponse.json()
                  return result
               } catch (e) {
                  console.error(e.stack)
                  throw e
               }
            }

            return resolver
         }
      }
      resolverFromPropertyParameter() {
         let [kv]: Pair[] = this.extract('prop')
         if (kv) {
            let [_k, propName] = kv
            let resolver = (parent: Record<any, any>) => {
               return parent[propName]
            }
            return resolver
         }
      }
      visitFieldDefinition(
         field: GraphQLField<any, any>,
      ): GraphQLField<any, any> {
         // Rest Parameters //
         let restResolver: UResolver = this.resolverFromRestParameter(field)
         let propertyResolver: UResolver = this.resolverFromPropertyParameter()

         if (restResolver && propertyResolver) {
            throw ono(
               'Rest parameters supplied along with property parameter',
               this.args,
               field,
            )
         }

         let resolver: UResolver = restResolver || propertyResolver
         if (resolver) {
            field.resolve = resolver
         }
         let newField: GraphQLField<any, any> = { ...field }
         return newField
      }
      visitObject(object: GraphQLObjectType): GraphQLObjectType {
         // Config Parameters //
         let config = this.extractConfig()
         if (config) {
            prop.config = config
         }
         return object
      }
   }
   return FromDirective
}

export const populateResolvers = (typeDefs: ITypeDefinitions, fetch: Fetch) => {
   let prop = {
      fetch,
      config: {
         configUrlBase: undefined,
         configQueryStringAdditions: [],
      },
   }
   let fromDirectiveClass = getFromDirective(prop)
   let schema = makeExecutableSchema({
      typeDefs: typeDefs,
      schemaDirectives: {
         from: fromDirectiveClass,
      },
   })
   if (prop.config.configUrlBase === undefined) {
      throw ono('No url base configured', prop.config)
   }
   return schema
}
