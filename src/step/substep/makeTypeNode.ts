import { validIdentifier } from '../../util';

import { TypeNode } from 'graphql';
import ono from 'ono';

type MakeTypeNode = (param: {
    typeValue: string;
    required: boolean;
    list: boolean;
}) => TypeNode;

export const makeTypeNode: MakeTypeNode = ({ typeValue, required, list }) => {
    if (!validIdentifier(typeValue)) throw ono({ typeValue });

    let typeNode: TypeNode = {
        kind: 'NamedType',
        name: {
            kind: 'Name',
            value: typeValue,
        },
    };

    if (list) {
        typeNode = {
            kind: 'ListType',
            type: {
                kind: 'NonNullType',
                type: typeNode,
            },
        };
    }

    if (required) {
        typeNode = {
            kind: 'NonNullType',
            type: typeNode,
        };
    }

    return typeNode;
};
