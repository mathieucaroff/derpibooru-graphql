// Gather the type predicate functions of the package
import Ajv from 'ajv';
import { Dump } from './dump';

import {
    ObjectTypeDefinitionNode,
    DefinitionNode,
    DocumentNode,
} from 'graphql';

export const isObjectTypeDefinitionNode = (
    obj: DefinitionNode,
): obj is ObjectTypeDefinitionNode => {
    return obj.kind === 'ObjectTypeDefinition';
};

const ajv = new Ajv();

export const validateDump = (dumpSchema: object, dump: object) => {
    const validate = ajv.compile(dumpSchema);
    const ok = ((o): o is Dump => validate(o) as boolean)(dump);
    if (!ok) {
        throw validate.errors;
    }
};

export const validateGraphql = (
    graphqlSchema: object,
    documentNode: object,
) => {
    const validate = ajv.compile(graphqlSchema);
    const ok = ((o): o is DocumentNode => validate(o) as boolean)(documentNode);
    if (!ok) {
        throw validate.errors;
    } else {
        console.log('GraphQL AST passes JSON Schema verification');
    }
};
