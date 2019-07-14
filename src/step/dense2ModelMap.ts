import ono from 'ono';

// Given the dense structure for the dump file, for each type, maps it to it's model
import { coherentList, objlen } from '../util';

// Types
import {
    Dense,
    DenseModel,
    DenseModelMap,
    RecStr,
    DenseModelInfo,
} from '../../types';
import { ReshapeModel } from './reshapeModel';

type PopulateModelMap = (param: {
    emptyModelInfo: { typeName: string; length: number }[];
    listMap: RecStr<DenseModelInfo[]>;
    kindName: string;
    modelMap: DenseModelMap;
}) => void;

const populateModelMap: PopulateModelMap = ({
    emptyModelInfo,
    listMap,
    kindName,
    modelMap,
}) => {
    Object.entries(listMap).forEach(([typeName, modelListInfo]) => {
        const modelListWithoutEmpty = modelListInfo.filter(
            ({ model }) => objlen(model) !== 0,
        );
        if (modelListWithoutEmpty.length < modelListInfo.length) {
            emptyModelInfo.push({
                typeName,
                length: modelListWithoutEmpty.length,
            });
        }
        const modelListWithoutAlmostEmtpy = modelListWithoutEmpty.filter(
            ({ model }) =>
                !(objlen(model) === 1 && Object.keys(model)[0] === ''),
        );
        if (modelListWithoutAlmostEmtpy.length < modelListWithoutEmpty.length) {
            emptyModelInfo.push({
                typeName: `${typeName} [strict "almost" filtering]`,
                length: modelListWithoutAlmostEmtpy.length,
            });
        }
        if (!coherentList(modelListWithoutAlmostEmtpy)) {
            const message = [
                `Incoherent models found in *${kindName}List* <${typeName}>,`,
                `number of properties for each *${kindName}* of the list:`,
                `[${modelListInfo.map((x) => objlen(x))}]`,
            ].join('\n');
            console.log(message);
            return;
        } else if (modelListWithoutEmpty.length === 0) {
            // The fact that this one was ignored is reported later
            // see "// => skipped"
            return;
        }
        const modelInfo = modelListWithoutEmpty[0];
        modelMap[typeName] = modelInfo;
    });
};

const keyExtractor = ({ typePath }) => typePath.split('\\').slice(-1)[0];

type Dense2ModelMap = (param: {
    dense: Dense;
    reshapeModel: ReshapeModel;
}) => {
    denseKey2InputTypeNameMap: RecStr<string>;
    modelMap: DenseModelMap;
    ignoredEntrySet: Set<string>;
    inputModelMap: DenseModelMap;
};

export const dense2ModelMap: Dense2ModelMap = ({ dense, reshapeModel }) => {
    // A) Models for responses
    const responseListMap: RecStr<DenseModelInfo[]> = {};
    const responseListMapBackup: RecStr<DenseModelInfo[]> = {};
    const modelListMap: RecStr<DenseModelInfo[]> = {};
    const modelListMapBackup: RecStr<DenseModelInfo[]> = {};
    // A.I) Get all models available for each type
    Object.entries(dense).forEach(([denseKey, denseEntry]) => {
        const { parsed, response } = denseEntry;
        const rmodel = {};
        Object.entries(response).forEach(([dottedName, field]) => {
            const regex = /^data(clients|grouped_results)?(\.|\[\])(?<end>.*)$/;
            const m = dottedName.match(regex);
            if (!m) {
                throw ono(
                    'Found a dottedName key in response which does not match',
                    { regex, dottedName },
                );
            }
            if (dottedName.match(/^data(clients|grouped_results)/)) {
                return;
            }
            const { end } = m.groups!;
            rmodel[end] = field;
        });
        if (!parsed) {
            return;
        }
        const { model, collection } = parsed;
        const typeName = keyExtractor(parsed);
        const rmap = collection ? responseListMap : responseListMapBackup;
        const mmap = collection ? modelListMap : modelListMapBackup;
        rmap[typeName] = [
            ...(rmap[typeName] || []),
            { denseKey, model: reshapeModel(rmodel) },
        ];
        mmap[typeName] = [
            ...(mmap[typeName] || []),
            { denseKey, model: reshapeModel(model) },
        ];
    });

    // A.II) Make sure they are coherent and summarize
    // A.II.a) Backup maps -- no coherence check, take the biggest
    const modelMap: DenseModelMap = {};
    [modelListMapBackup, responseListMapBackup].forEach((listMapBackup) => {
        Object.entries(listMapBackup).forEach(([typeName, modelList]) => {
            const list = [...modelList].sort((a, b) => {
                return objlen(a.model) - objlen(b.model);
            });
            if (objlen(list[0]) > objlen(list.slice(-1)[0])) {
                throw ono('Internal implementation error (.sort usage)');
            }
            let modelInfo = list[0];
            modelMap[typeName] = modelInfo;
        });
    });

    if (modelListMap['array']) {
        throw ono('array found into modelListMap');
    }

    // A.II.a) Real maps -- with coherence checks
    const emptyModelInfo: { typeName: string; length: number }[] = [];
    [
        // Keeping the two of them = 17 missing
        responseListMap, // without responseListMap = 40 missing
        modelListMap, // without modelListMap = 30 missing
    ].forEach((listMap) => {
        populateModelMap({
            emptyModelInfo,
            listMap,
            kindName: 'model',
            modelMap,
        });
    });

    // B Input models for mutations
    // B.I) Get all models available for each type
    const ignoredEntrySet = new Set<string>();
    const inputModelListMap: RecStr<DenseModelInfo[]> = {};
    const denseKey2InputTypeNameMap: RecStr<string> = {};
    Object.entries(dense).forEach(([denseKey, denseEntry]) => {
        const {
            method,
            classInput: { typePath } = { typePath: '' },
            parameters,
        } = denseEntry;
        if (!typePath) {
            ignoredEntrySet.add(denseKey);
            return;
        }
        const key = keyExtractor({ typePath });

        const suffix = {
            DELETE: 'Delete',
            GET: '',
            HEAD: 'HEAD',
            OPTIONS: 'OPTIONS',
            PATCH: 'Patch',
            POST: 'Create',
            PUT: 'Update',
        }[method]; // /!\ Copy-pasted

        let typeName = `${key}${suffix}`;
        denseKey2InputTypeNameMap[denseKey] = typeName;

        if (modelMap[typeName]) {
            const message = [
                `Colliding name input model name $ -- skipped`,
                `${typeName}`,
            ].join('\n');
            console.log(message);
        }

        inputModelListMap[typeName] = [
            ...(inputModelListMap[typeName] || []),
            { denseKey, model: reshapeModel(parameters) },
        ];
    });

    // B.II) Make sure they are coherent and summarize
    const inputEmptyModelInfo: { typeName: string; length: number }[] = [];
    const inputModelMap: DenseModelMap = {};
    populateModelMap({
        emptyModelInfo: inputEmptyModelInfo,
        listMap: inputModelListMap,
        kindName: 'input model',
        modelMap: inputModelMap,
    });

    // Logging //
    const formatInfo = ({ typeName, length }) => {
        return `${typeName}: ${length || '0, // => skipped'},`;
    };
    // A)
    if (emptyModelInfo.length) {
        const message = [
            `Removed empty model(s) from (${emptyModelInfo.length}) model lists`,
            `Number of remaining model per model list: {`,
            `  ${emptyModelInfo
                .map(formatInfo)
                .sort()
                .join('\n  ')}`,
            `}`,
        ].join('\n');
        console.log(message);
    }

    // B)
    if (inputEmptyModelInfo.length) {
        const message = [
            `Removed empty input model(s) from (${inputEmptyModelInfo.length}) model lists`,
            `Number of remaining input model per model list: {`,
            `  ${inputEmptyModelInfo
                .map(formatInfo)
                .sort()
                .join('\n  ')}`,
            `}`,
        ].join('\n');
        console.log(message);
    }

    return {
        denseKey2InputTypeNameMap,
        ignoredEntrySet,
        inputModelMap,
        modelMap,
    };
};
