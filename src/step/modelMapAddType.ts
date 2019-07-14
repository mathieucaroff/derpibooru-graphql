import ono from 'ono';

// Type../../types
import { DenseField, DenseModelMap as ModelMap, RecStr } from '../../types';

export type DenseFieldWithType = DenseField & { typeValue: string };

export type ModelWithType = RecStr<DenseFieldWithType>;

export type ModelMapWithType = RecStr<{
    denseKey: string;
    model: ModelWithType;
}>;

// * Compute the graphql type name and add it to the
export const modelMapAddType = (modelMap: ModelMap, preType2TypeValue) => {
    let modelMapWithType: ModelMapWithType = {};
    Object.entries(modelMap).forEach(([typeName, modelInfo]) => {
        const { denseKey, model } = modelInfo;
        const modelWithType: RecStr<DenseFieldWithType> = {};
        Object.entries(model).forEach(([fieldName, field]) => {
            const { dataType, actualType, subType } = field;

            let preType: string;
            if (subType) {
                preType = subType.split('\\').slice(-1)[0];
            } else {
                preType = actualType || dataType!;
            }
            if (!preType || !preType.match(/^[A-Za-z_][A-Za-z0-9_]*$/)) {
                throw ono('Could not produce preType for', { field });
            }

            const typeValue = preType2TypeValue(preType);

            modelWithType[fieldName] = {
                ...field,
                typeValue,
            };
        });
        modelMapWithType[typeName] = {
            denseKey,
            model: modelWithType,
        };
    });

    return modelMapWithType;
};
