import {
    DocumentNode,
    ObjectTypeDefinitionNode,
    FieldDefinitionNode,
    ScalarTypeDefinitionNode,
    DefinitionNode,
    InputValueDefinitionNode,
    InputObjectTypeDefinitionNode,
} from 'graphql';

import { TypeMap, Writable, InputTypeMap, RecStr } from '../../types';
import ono from 'ono';
import { validIdentifier } from '../util';

type TypeMap2Graphql = (param: {
    definitionScalarMap: RecStr<string>;
    inputTypeMap: InputTypeMap;
    typeMap: TypeMap;
}) => DocumentNode;

export const typeMap2Graphql: TypeMap2Graphql = ({
    definitionScalarMap,
    inputTypeMap,
    typeMap,
}) => {
    const definitions: DefinitionNode[] = [];

    // Scalar type definitions
    Object.values(definitionScalarMap).forEach((name) => {
        if (!validIdentifier(name)) throw ono({ name });

        const scalarDefinition: ScalarTypeDefinitionNode = {
            kind: 'ScalarTypeDefinition',
            name: {
                kind: 'Name',
                value: name,
            },
        };
        definitions.push(scalarDefinition);
    });

    // Object Type definitions
    Object.entries(typeMap).forEach(([typeName, fieldObj]) => {
        if (!validIdentifier(typeName)) {
            throw ono({ typeName });
        }

        let fields: FieldDefinitionNode[] = [];
        Object.entries(fieldObj).map(([fieldName, field]) => {
            if (!validIdentifier(fieldName)) {
                throw ono({ fieldName });
            }

            const { type, argumentList, description } = field;
            const fieldDefinition: Writable<FieldDefinitionNode> = {
                kind: 'FieldDefinition',
                name: {
                    kind: 'Name',
                    value: fieldName,
                },
                type,
                arguments: argumentList,
            };
            if (description) {
                fieldDefinition.description = {
                    kind: 'StringValue',
                    value: description,
                };
            }
            fields.push(fieldDefinition);
        });

        const objectTypeDefinitionNode: ObjectTypeDefinitionNode = {
            kind: 'ObjectTypeDefinition',
            name: {
                kind: 'Name',
                value: typeName,
            },
            fields,
        };

        definitions.push(objectTypeDefinitionNode);
    });

    // Input Type definitions
    Object.entries(inputTypeMap).forEach(([typeName, fieldObj]) => {
        if (!validIdentifier(typeName)) {
            throw ono({ typeName });
        }

        let fields: InputValueDefinitionNode[] = [];
        Object.entries(fieldObj).map(([fieldName, field]) => {
            if (!validIdentifier(fieldName)) {
                throw ono({ fieldName });
            }

            const { type, description } = field;
            const fieldDefinition: Writable<InputValueDefinitionNode> = {
                kind: 'InputValueDefinition',
                name: {
                    kind: 'Name',
                    value: fieldName,
                },
                type,
            };
            if (description) {
                fieldDefinition.description = {
                    kind: 'StringValue',
                    value: description,
                };
            }

            fields.push(fieldDefinition);
        });

        const objectTypeDefinitionNode: InputObjectTypeDefinitionNode = {
            kind: 'InputObjectTypeDefinition',
            name: {
                kind: 'Name',
                value: typeName,
            },
            fields,
        };

        definitions.push(objectTypeDefinitionNode);
    });

    const document: DocumentNode = {
        kind: 'Document',
        definitions,
    };

    return document;
};
