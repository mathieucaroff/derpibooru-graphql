// Given an entry, produces the name to use for the Query or Mutation field
import { DenseEntry } from '../../types';
import ono from 'ono';

const capitalize = (s) => {
    return s && s[0].toUpperCase() + s.slice(1);
};

const snakeToCamel = (input: string) => {
    const initList = input.match(/_[a-z]/g) || [];
    let output = input;
    initList.forEach((first) => {
        output = output.replace(first, first[1].toUpperCase());
    });
    return output;
};

const singularize = (word) => {
    const singular = word
        .replace(/ies(_|$)/g, 'y$1')
        .replace(/s(_|$)/g, '$1')
        .replace(/people/, 'person');
    return singular;
};

type Entry2FieldName = (param: { entry: DenseEntry }) => { fieldName: string };

export const entry2FieldName: Entry2FieldName = ({ entry }) => {
    const { method, uri } = entry;

    const suffix = {
        DELETE: 'Delete',
        GET: '',
        HEAD: 'HEAD',
        OPTIONS: 'OPTIONS',
        PATCH: 'Patch',
        POST: 'Create',
        PUT: 'Update',
    }[method]; // /!\ Copy-pasted

    const shortUri = uri.replace(/\/?\{[^}]*\}/g, '');
    const several = method === 'GET' && shortUri.length === uri.length;
    const flavor: 'beginning' | 'end' = 'end' as any; // "beginning";
    if (flavor === 'beginning') {
        var singularUri = several ? shortUri : singularize(shortUri);
        var prefixedUri = `${several ? 'all_' : ''}${singularUri}`;
    } else if (flavor === 'end') {
        var singularUri = several ? shortUri : singularize(shortUri);
        var prefixedUri = `${singularUri}${several ? '_all' : ''}`;
    } else throw ono('Wrong flavor', flavor);
    const limitedUri = prefixedUri.replace(/[^A-Za-z0-9]/g, '_');
    const camelUri = snakeToCamel(limitedUri);
    const niceUri = camelUri;

    const fieldName = `${niceUri}${suffix}`;

    return { fieldName };
};
