import { GraphQLSchema, GraphQLObjectType, GraphQLField } from 'graphql'

export type DirectiveVisitorObject = {
    visitFieldDefinition?: (param: {
        field: GraphQLField<any, any>
        parent: GraphQLObjectType
    }) => GraphQLField<any, any>
}

export type Visit = (param: {
    schema: GraphQLSchema
    schemaDirectives: {
        [x: string]: DirectiveVisitorObject
    }
}) => GraphQLSchema

export const visit: Visit = ({ schema, schemaDirectives }) => {
    return schema
}
