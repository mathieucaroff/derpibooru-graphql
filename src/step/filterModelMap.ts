import { objlen } from '../util';

// Types
import { ModelWithType, ModelMapWithType } from './modelMapAddType';
import { TypeExists } from '../../types';
import { ExceptionObject } from '../report';

export type FilterModelMap = (
    modelMap: ModelMapWithType,
    namedParam: {
        typeExists: TypeExists;
        exceptionObject: ExceptionObject;
    },
) => {};

export const filterModelMap: FilterModelMap = (
    modelMap,
    { typeExists, exceptionObject },
) => {
    const { ignoredFieldSet, ignoredModelSet } = exceptionObject;

    let filteredModelMap: ModelMapWithType = {};
    Object.entries(modelMap).forEach(([typeName, modelInfoWithType]) => {
        const filteredModel: ModelWithType = {};
        const { denseKey, model: modelWithType } = modelInfoWithType;

        Object.entries(modelWithType).forEach(([fieldName, field]) => {
            const { typeValue: fieldType } = field;
            if (!typeExists(fieldType, modelMap)) {
                ignoredFieldSet.add(
                    `{ ${fieldType} :${fieldName} } ${typeName}`,
                );
                return;
            }

            filteredModel[fieldName] = field;
        });

        if (objlen(filteredModel) > 0) {
            filteredModelMap[typeName] = { denseKey, model: filteredModel };
        } else {
            ignoredModelSet.add(`${typeName}`);
        }
    });

    return filteredModelMap;
};
