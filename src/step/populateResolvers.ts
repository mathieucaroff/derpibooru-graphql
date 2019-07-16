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

type GetGetValue = (param: { name: string }) => GetValue

let getGetValue: GetGetValue = ({ name }) => ({
   parent,
   args,
   context,
   info,
}) => {
   return ''
}

type Pair = [string, string]

type Resolver = GraphQLFieldResolver<Record<any, any>, any>
type UResolver = Resolver | undefined

type FromDirectiveProp = {
   fetch: Fetch
}

class FromDirective {
   config: {
      configUrlBase: string
   }
   name: string
   args: Record<string, any>
   prop: FromDirectiveProp

   constructor(prop: FromDirectiveProp) {
      this.prop = prop
   }
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
   resolverFromRestParameter(field) {
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
                  let getValue = getGetValue({ name })
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
            return this.prop.fetch(uri, { method: method.toUpperCase() })
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
      parent: GraphQLObjectType,
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

export const populateResolvers = (
   schema: GraphQLSchema,
   fetch: Fetch,
): GraphQLSchema => {
   let fromDirective = new FromDirective({ fetch })
   return visit({
      schema,
      schemaDirectives: {
         from: fromDirective,
      },
   })
}
