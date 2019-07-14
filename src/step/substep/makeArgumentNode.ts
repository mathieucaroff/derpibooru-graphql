import ono from 'ono';
import { validIdentifier } from '../../util';

import { InputValueDefinitionNode, TypeNode } from 'graphql';

import { Writable } from '../../../types';

type MakeArgumentNode = (param: {
    argumentName: string;
    typeNode: TypeNode;
}) => Writable<InputValueDefinitionNode>;

export const makeArgumentNode: MakeArgumentNode = ({
    argumentName,
    typeNode,
}) => {
    if (!validIdentifier(argumentName)) {
        throw ono({ argumentName });
    }

    const argumentDefinition: Writable<InputValueDefinitionNode> = {
        kind: 'InputValueDefinition',
        name: {
            kind: 'Name',
            value: argumentName,
        },
        type: typeNode,
    };
    return argumentDefinition;
};
