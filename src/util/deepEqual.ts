import { objlen } from './object';
import { RecStr } from '../../types';

export const deepEqual = function(x: unknown, y: unknown) {
    if (x === y) {
        return true;
    } else if (
        typeof x == 'object' &&
        x != null &&
        (typeof y == 'object' && y != null)
    ) {
        if (objlen(x) != objlen(y)) return false;
        const xx = x as RecStr<unknown>;
        const yy = y as RecStr<unknown>;

        for (var prop in xx) {
            if (yy.hasOwnProperty(prop)) {
                if (!deepEqual(xx[prop], yy[prop])) {
                    return false;
                }
            } else {
                return false;
            }
        }

        return true;
    } else return false;
};
