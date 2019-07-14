import { deepEqual } from './deepEqual';

export const coherentList = (li: object[]) => {
    if (!li.length) {
        return true;
    }
    const reference = li[0];
    const coherent = li.every((item) => {
        return deepEqual(reference, item);
    });

    return coherent;
};
