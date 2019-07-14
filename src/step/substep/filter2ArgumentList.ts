// Types
import { InputValueDefinitionNode } from 'graphql';
import { DenseFilterField, Writable, RecStr } from '../../../types';
import { makeArgumentNode } from './makeArgumentNode';
import { makeTypeNode } from './makeTypeNode';

export function filter2ArgumentList(
    filters: RecStr<DenseFilterField>,
    preType2TypeValue: (preType: string) => string,
) {
    const ignoredFilterNameInfo: any[] = [];
    const ignoredFilterTypeInfo: any[] = [];
    const argumentList: InputValueDefinitionNode[] = [];
    Object.entries(filters).forEach(([filterName, filter]) => {
        if (!filterName.match(/^[_A-Za-z][_0-9A-Za-z]*$/)) {
            ignoredFilterNameInfo.push(filterName);
            return;
        }
        let { dataType, description, default: default_ } = filter;
        if (!['integer', 'string', 'boolean'].includes(dataType)) {
            ignoredFilterTypeInfo.push({ dataType, filterName });
            dataType = 'string';
        }
        const typeValue = preType2TypeValue(dataType);
        const typeNode = makeTypeNode({
            typeValue,
            required: false,
            list: false,
        });
        const argumentDefinition = makeArgumentNode({
            argumentName: filterName,
            typeNode,
        });
        if (description || default_) {
            const space = description && default_ ? ' ' : '';
            const monoline = (description || '').replace('\n', ' -- ');
            const defaultStr = default_ ? `(default: ${default_})` : '';
            const value = `${monoline}${space}${defaultStr}`;
            argumentDefinition.description = {
                kind: 'StringValue',
                value,
            };
        }
        argumentList.push(argumentDefinition);
    });

    return {
        ok: argumentList,
        errFilterName: ignoredFilterNameInfo,
        errFilterType: ignoredFilterTypeInfo,
    };
}
