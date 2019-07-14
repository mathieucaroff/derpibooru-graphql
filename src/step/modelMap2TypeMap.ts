import { makeTypeNode } from './substep';
import { objlen } from '../util';

// Types
import { TypeNode } from 'graphql';

import {
    FieldObj,
    TypeMap,
    InputTypeMap,
    PartialFieldDefinition,
    RecStr,
    PartialInputFieldDefinition,
} from '../../types';

import { ModelMapWithType, DenseFieldWithType } from './modelMapAddType';

type PopulateTypeMap = <Partial>(arg: {
    filteredModelMap: ModelMapWithType;
    typeMap: RecStr<RecStr<Partial>>;
    field2TypeNode: (field: DenseFieldWithType) => TypeNode;
    typeNode2Partial: (
        denseKey: string,
        field: DenseFieldWithType,
        node: TypeNode,
    ) => Partial;
}) => void;

const populateTypeMap: PopulateTypeMap = ({
    filteredModelMap,
    typeMap,
    field2TypeNode,
    typeNode2Partial,
}) => {
    Object.entries(filteredModelMap).forEach(([typeName, modelInfoWType]) => {
        const { denseKey, model } = modelInfoWType;
        const fieldObj = {};
        Object.entries(model).forEach(([dottedName, field]) => {
            const fieldName = dottedName.replace(/\[\]$/, '');
            const typeNode = field2TypeNode(field);
            fieldObj[fieldName] = typeNode2Partial(denseKey, field, typeNode);
        });
        if (objlen(fieldObj) > 0) {
            typeMap[typeName] = fieldObj;
        }
    });
};

const field2TypeNode = (field: DenseFieldWithType) => {
    let { actualType, required, typeValue } = field;
    const typeNode = makeTypeNode({
        typeValue,
        required: required || false,
        list: actualType === 'collection',
    });
    return typeNode;
};

const typeNode2PartialInput = (
    denseKey: string,
    field: DenseFieldWithType,
    typeNode: TypeNode,
): PartialInputFieldDefinition => {
    return {
        denseKey,
        description: field.description || undefined,
        type: typeNode,
    };
};

type ModelMap2TypeMap = (param: {
    filteredModelMap: ModelMapWithType;
    filteredInputModelMap: ModelMapWithType;
    Mutation: FieldObj;
    Query: FieldObj;
}) => {
    inputTypeMap: InputTypeMap;
    typeMap: TypeMap;
};

export const modelMap2TypeMap: ModelMap2TypeMap = ({
    filteredModelMap,
    filteredInputModelMap,
    Mutation,
    Query,
}) => {
    // Converting to GraphQl TypeNodes
    const typeMap: TypeMap = { Query };
    const inputTypeMap: InputTypeMap = {};

    if (objlen(Mutation) > 0) {
        typeMap.Mutation = Mutation;
    }

    populateTypeMap<PartialFieldDefinition>({
        filteredModelMap,
        typeMap,
        field2TypeNode,
        typeNode2Partial: (denseKey, field, typeNode) => {
            return {
                ...typeNode2PartialInput(denseKey, field, typeNode),
                argumentList: [],
            };
        },
    });

    populateTypeMap<PartialInputFieldDefinition>({
        filteredModelMap: filteredInputModelMap,
        typeMap: inputTypeMap,
        field2TypeNode,
        typeNode2Partial: typeNode2PartialInput,
    });

    return { inputTypeMap, typeMap };
};
