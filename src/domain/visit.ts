import {
   GraphQLSchema,
   GraphQLObjectType,
   GraphQLField,
   ASTVisitor,
} from 'graphql'

export type DirectiveVisitorObject = {
   visitFieldDefinition?: (param: {
      field: GraphQLField<any, any>
      parent: GraphQLObjectType
   }) => GraphQLField<any, any>
   visitObject?: (param: { object: GraphQLObjectType }) => GraphQLObjectType
}

export type Visit = (param: {
   schema: GraphQLSchema
   schemaDirectives: {
      [x: string]: DirectiveVisitorObject
   }
}) => GraphQLSchema

let visitNode = (node: ASTVisitor, ca) => {}

export const visit: Visit = ({ schema, schemaDirectives }) => {
   return schema
}
