// Flatten a dump structure into a dense structure

import { Dump, DumpEntry, DumpClassInput } from '../../types/dump';
import { Dense, DenseEntry, DenseClassInput } from '../../types/dense';
import ono from 'ono';

const dumpEntry2denseEntry = (
    dumpEntry: DumpEntry,
    category: string,
): DenseEntry => {
    const {
        apiModes,
        apiTags,
        authentication,
        classInput: classInputModel,
        classOutput,
        deprecated,
        description,
        documentation,
        filters,
        https,
        id,
        method,
        parameters,
        parsedResponseMap,
        response,
        section,
        statusCodes,
        tags,
    } = dumpEntry;
    let { uri } = dumpEntry;

    if (Object.keys(tags || {}).includes('unstable')) {
        throw ono('Unstable entry', dumpEntry);
    }

    let parsed;
    if (parsedResponseMap !== undefined) {
        let {
            200: {
                type: { class: typePath, collection, collectionName },
                model,
            },
        } = parsedResponseMap;
        if (model.length !== undefined) {
            model = {};
        }

        parsed = {
            typePath,
            collection,
            collectionName,
            model,
        };
    }

    let classInput: DenseClassInput | undefined;
    if (classInputModel) {
        let {
            class: typePath = classInputModel as string,
            options = {},
        } = classInputModel as DumpClassInput;
        classInput = {
            typePath,
            options,
        };
    }

    // const prefix = '/api/v2/';
    // console.assert(uri.startsWith(prefix), `uri prefix -- ${uri}`);
    // uri: string = uri.slice(prefix.length);
    const m = uri.match(new RegExp('^/api/v2/(?<end>.*)$'));
    if (!m) {
        throw ono('Unhandeled uri value -- Regex failed', uri);
    }
    uri = m.groups!.end;

    const denseEntry: DenseEntry = {
        apiModes,
        apiTags,
        authentication,
        category,
        classInput,
        classOutput: classOutput || '',
        deprecated,
        description: description || '',
        documentation: documentation || '',
        filters: filters || {},
        https,
        id,
        method,
        parameters: parameters || {},
        parsed,
        response: response || {},
        section,
        statusCodes: statusCodes || {},
        tags: tags || {},
        uri,
    };

    return denseEntry;
};

export const dump2dense = (dump: Dump, invalidFieldNameInfo: any[]): Dense => {
    const dense: Dense = {};
    Object.entries(dump).forEach(([category, categoryContent]) => {
        categoryContent.others.forEach((dumpEntry) => {
            let denseEntry;
            try {
                denseEntry = dumpEntry2denseEntry(dumpEntry, category);
            } catch (e) {
                if (e.stack.match(/Unstable entry/)) {
                    return;
                } else {
                    throw e;
                }
            }
            const { uri, method } = denseEntry;
            const ternUri = uri.replace(/[^A-Za-z0-9]/g, '_');
            const denseKey = `${ternUri}_${method.toLowerCase()}`;
            if (denseKey.match(/^\d/)) {
                invalidFieldNameInfo.push(denseKey);
                return;
            }
            dense[denseKey] = denseEntry;
        });
    });

    return dense;
};
