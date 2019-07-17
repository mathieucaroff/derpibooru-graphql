// Types
import {
   ArgumentNode,
   GraphQLDirective,
   GraphQLDirectiveConfig,
   GraphQLField,
   GraphQLFieldResolver,
   GraphQLObjectType,
   GraphQLResolveInfo,
   GraphQLSchema,
} from 'graphql'

import { Fetch } from '../type'

// JS
import ono from 'ono'

import {
   SchemaDirectiveVisitor,
   makeExecutableSchema,
   ITypeDefinitions,
} from 'graphql-tools'

import { visit } from '../domain'

import { entries } from '../util'

let extract = <T>(keyList: string[], obj: Record<any, T>): [string, T][] => {
   return entries(obj).filter(([key, value]) => {
      return keyList.includes(key) && value !== undefined
   })
}

type GetValue = (param: {
   parent: Record<any, any>
   args: Record<any, any>
   context: any
   info: GraphQLResolveInfo
}) => string

type GetGetValue = (param: {
   name: string
   field: GraphQLField<any, any>
}) => GetValue

let getGetValue: GetGetValue = ({ name, field }) => ({
   parent,
   args,
   context,
   info,
}) => {
   let value = args[name]
   if (value === undefined) {
      value = parent[name]
   }
   if (value === undefined) {
      throw ono(
         `could not find "${name}" neither in args, nor in the parent JSON`,
         { field, args, parent },
      )
   }
   return ''
}

type Pair = [string, string]

type Resolver = GraphQLFieldResolver<Record<any, any>, any>
type UResolver = Resolver | undefined

type FromDirectiveProp = {
   fetch: Fetch
}

let getFromDirective = (prop: FromDirectiveProp) => {
   return class FromDirective extends SchemaDirectiveVisitor {
      config: {
         configUrlBase: string
      }
      name: string
      args: Record<string, any>

      anyNode() {
         // Config Parameters //
         let config = this.extractConfig()
         if (config) {
            this.config = config
         }
      }
      extract(keyString: string) {
         return extract(keyString.split(' '), this.args)
      }
      extractConfig() {
         let configPairList: Pair[] = this.extract('configUrlBase')
         return {
            ...Object['fromEntries'](configPairList),
            ...(this.config || {}),
         }
      }
      getGetValue: GetGetValue = ({ name, field }) => ({
         parent,
         args,
         context,
         info,
      }) => {
         let value = args[name]
         if (value === undefined) {
            value = parent[name]
         }
         if (value === undefined) {
            throw ono(
               `could not find "${name}" neither in args, nor in the parent JSON`,
               { field, args, parent },
            )
         }
         return ''
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
                     let getValue = getGetValue({ name, field })
                     replaceList.push({
                        getValue,
                        regex: new RegExp(`:${name}\\b`, 'g'),
                     })
                  }
               }
            })

            let resolver = (param) => {
               let uri = uriTemplate
               replaceList.forEach(({ getValue, regex }) => {
                  uri = uri.replace(regex, getValue(param))
               })
               return prop.fetch(uri, { method: method.toUpperCase() })
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
      visitFieldDefinition = (
         field: GraphQLField<any, any>,
      ): GraphQLField<any, any> => {
         this.anyNode()

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
      visitObject = (object: GraphQLObjectType): GraphQLObjectType => {
         this.anyNode()
         return object
      }
   }
}

export const populateResolvers = (
   typeDefs: ITypeDefinitions,
   fetch: Fetch,
): GraphQLSchema => {
   let fromDirectiveClass = getFromDirective({ fetch })
   return makeExecutableSchema({
      typeDefs: typeDefs,
      schemaDirectives: {
         from: fromDirectiveClass,
      },
   })
}
