// Extract the entry points from a dense structure of a Nelmio dump file

// Types
import { Dense, RecStr } from '../../types';
import ono from 'ono';

class TypeEntry {
    entryList: {
        uri: string;
        denseKey: string;
    }[] = [];
    getIdEntry() {
        const [entry] = this.entryList.filter(({ uri, denseKey }) => {
            return uri.includes('{id}');
        });
        if (!entry) {
            throw new Error('No uri with {id}');
        }
        return entry;
    }
}

export type TypeEntryMap = RecStr<TypeEntry>;

type Dense2EntryMap = (param: {
    dense: Dense;
}) => { typeEntryMap: TypeEntryMap };

export const dense2TypeEntryMap: Dense2EntryMap = ({ dense }) => {
    const typeEntryMap: TypeEntryMap = {};

    Object.entries(dense).map(([denseKey, denseEntry]) => {
        const { uri, parsed, method } = denseEntry;
        if (method !== 'GET') {
            return;
        } // In the future support mutations
        if (!parsed) {
            return;
        }
        if (!uri) {
            throw ono('!uri', denseEntry);
        }
        const { typePath } = parsed;

        const typeName = typePath.split('\\').slice(-1)[0];

        typeEntryMap[typeName] = typeEntryMap[typeName] || new TypeEntry();
        typeEntryMap[typeName].entryList.push({ uri, denseKey });
    });

    return { typeEntryMap };
};
