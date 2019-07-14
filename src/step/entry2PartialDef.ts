import { filter2ArgumentList, makeTypeNode, makeArgumentNode } from './substep';

// Types
import { InputValueDefinitionNode } from 'graphql';

import { DenseEntry, PartialFieldDefinition, TypeExists } from '../../types';
import { ModelMapWithType } from './modelMapAddType';
import ono from 'ono';

type Entry2PartialDef = (param: {
    denseKey: string;
    entry: DenseEntry;
    filteredInputModelMap: ModelMapWithType;
    filteredModelMap: ModelMapWithType;
    get: boolean;
    inputTypeName: string;
    method: string;
    preType2TypeValue: (a: string) => string;
    typeExists: TypeExists;
}) => {
    errMissingType?: { fieldType: string };
    errFilterName?: string[];
    errFilterType?: any[];
    errNoModel?: true;
    errTypeName?: { typePath: string };
    ok?: {
        partialDef: PartialFieldDefinition;
        urlArgumentNameList: string[];
    };
};

export const entry2PartialDef: Entry2PartialDef = ({
    denseKey,
    entry,
    filteredInputModelMap,
    filteredModelMap,
    get,
    inputTypeName,
    method,
    preType2TypeValue,
    typeExists,
}) => {
    let result: ReturnType<Entry2PartialDef> = {};

    const { uri, description, filters, parsed } = entry;

    if (get) {
        if (!parsed) {
            // No information to extract from `parsed` => skipping
            result.errNoModel = true;
            return result;
        }
    }

    let argumentList: InputValueDefinitionNode[] = [];

    const argListResult = filter2ArgumentList(filters, preType2TypeValue);
    ({ ok: argumentList, ...result } = argListResult);

    const urlArgumentNameList = uri.match(/(?<=\{)\w+(?=\})/g) || [];
    urlArgumentNameList.forEach((argumentName) => {
        const typeNode = makeTypeNode({
            typeValue: 'Int',
            required: true,
            list: false,
        });
        const argumentDefinition = makeArgumentNode({
            argumentName,
            typeNode,
        });
        argumentList.push(argumentDefinition);
    });

    if (get) {
        const { typePath, collection } = parsed!;
        const preType = typePath.split('\\').slice(-1)[0];
        const fieldType = preType2TypeValue(preType);
        if (!fieldType.match(/^[A-Za-z_][A-Za-z0-9_]*$/)) {
            result.errTypeName = { typePath };
            return result;
        }
        if (!typeExists(fieldType, filteredModelMap)) {
            result.errMissingType = { fieldType };
            return result;
        }
        var retType = makeTypeNode({
            typeValue: fieldType,
            required: true,
            list: collection || false,
        });
    } else {
        if (inputTypeName) {
            var inputModelInfo = filteredInputModelMap[inputTypeName];
            if (inputModelInfo) {
                const typeNode = makeTypeNode({
                    typeValue: inputTypeName,
                    required: true,
                    list: false,
                });
                argumentList.push(
                    makeArgumentNode({
                        argumentName: 'data',
                        typeNode,
                    }),
                );
            } else {
                result.errMissingType = { fieldType: inputTypeName };
            }
        }

        const retTypeValue =
            {
                POST: 'Int',
            }[method] || 'Boolean';

        var retType = makeTypeNode({
            typeValue: retTypeValue,
            required: true,
            list: false,
        });
    }

    const partialDef: PartialFieldDefinition = {
        argumentList,
        denseKey,
        description: description || undefined,
        type: retType,
    };
    result.ok = { partialDef, urlArgumentNameList };
    return result;
};
