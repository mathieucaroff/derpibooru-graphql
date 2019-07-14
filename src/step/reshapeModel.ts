import { DenseModel } from '../../types';
import { validIdentifier } from '../util';

// reshapeModel

export type ReshapeModel = (model: DenseModel) => DenseModel;

export const reshapeModel = (compoundNameSet): ReshapeModel => (modelArg) => {
    const model: DenseModel = {};
    Object.entries(modelArg).forEach(([compoundName, field]) => {
        const dottedName = compoundName.replace(
            /\[([_$A-Za-z][_$A-Za-z0-9])\]/g,
            '.$1',
        ); // TODO: move to `dense2ModelMap`.
        if (dottedName.replace(/\[\]$/, '').match(/\.|\[|\]|^\d|^$/)) {
            compoundNameSet.add(`${compoundName}`);
            return;
        }
        const fieldName = dottedName;
        if (!validIdentifier(fieldName)) {
            console.log(
                '[reshapeModel] excluding invalid fieldName:',
                fieldName,
            );
        }
        model[fieldName] = field;
    });
    return model;
};
