// Brings all components together

console.log('SGQ Restart');
require('source-map-support').install();

// import { install } from 'source-map-support';
// install();

import { promises as fs } from 'fs';

// Dependencies
import { ApolloServer } from 'apollo-server';
import jsYaml from 'js-yaml';
import { print } from 'graphql';

// Files
import { report, ExceptionObject } from './report';
import { resolverObj } from './resolverObj';

// Directories
import { objlen, distribute } from './util';
import {
    dense2TypeEntryMap,
    dense2ModelMap,
    dump2dense,
    entry2FieldName,
    entry2PartialDef,
    filterModelMap,
    modelMap2TypeMap,
    modelMapAddType,
    reshapeModel,
    typeMap2Graphql,
} from './step';

// Type
import { ModelMapWithType } from './step';
import {
    validateDump,
    validateGraphql,
    TypeExists,
    FieldObj,
    RecStr,
} from '../types';

const run = async (): Promise<void> => {
    console.clear();
    console.log('SGQ Starting');

    // A Type conversions declaration //
    const definitionScalarMap = {
        datetime: 'Datetime',
        file: 'File',
        PersonEmail: 'PersonEmail',
        token: 'Tocken',
    };
    const existingScalarMap = {
        boolean: 'Boolean',
        float: 'Float',
        integer: 'Int',
        string: 'String',
    };

    const preType2TypeValue = (preType) => {
        const fieldType =
            existingScalarMap[preType] ||
            definitionScalarMap[preType] ||
            preType;
        return fieldType;
    };

    const scalarTypeSet = new Set([
        ...Object.values(definitionScalarMap),
        ...Object.values(existingScalarMap),
    ]);

    const typeExists: TypeExists = (typeName, testObj) => {
        if (scalarTypeSet.has(typeName)) {
            return true;
        } else if (testObj[typeName]) {
            return true;
        }
        return false;
    };
    // V //

    // A Load and validate dump //
    const dump = jsYaml.load(await fs.readFile('tmp/dp.api.yml', 'utf-8'));

    const jsonDumpSchema = 'jsonSchema/json-dump.schema.json';
    const dumpSchema = JSON.parse(await fs.readFile(jsonDumpSchema, 'utf-8'));
    validateDump(dumpSchema, dump);
    // V //

    // Convert the dump to dense //
    const invalidFieldNameInfo: any[] = [];
    const dense = dump2dense(dump, invalidFieldNameInfo);

    // Compute the modelMap //
    const exceptionObject = new ExceptionObject();
    const { compoundNameFieldSet } = exceptionObject;
    const {
        denseKey2InputTypeNameMap,
        modelMap,
        inputModelMap,
    } = dense2ModelMap({
        dense,
        reshapeModel: reshapeModel(compoundNameFieldSet),
    });
    // Computing the fieldType for each field
    const addType = (modelMap) => modelMapAddType(modelMap, preType2TypeValue);
    let modelMapWithType: ModelMapWithType = addType(modelMap);
    let inputModelMapWithType: ModelMapWithType = addType(inputModelMap);

    // A Filter by field name and by existing types //
    const filter = (modelMap: ModelMapWithType, exceptionObject) => {
        let filteredModelMap = modelMap;
        let previousMap: ModelMapWithType;
        do {
            previousMap = filteredModelMap;
            filteredModelMap = filterModelMap(filteredModelMap, {
                typeExists,
                exceptionObject,
            });
        } while (objlen(filteredModelMap) < objlen(previousMap));
        return filteredModelMap;
    };
    const filteredModelMap: ModelMapWithType = filter(
        modelMapWithType,
        exceptionObject,
    );
    const inputExceptionObject = new ExceptionObject();
    const filteredInputModelMap: ModelMapWithType = filter(
        inputModelMapWithType,
        inputExceptionObject,
    );
    // V //

    // Populate the `Query` and `Mutation` special types
    const ignoredFilterTypeInfo: any[] = [];
    const urlArgumentMap: RecStr<string[]> = {};
    const Query: FieldObj = {};
    const Mutation: FieldObj = {};
    Object.entries(dense).forEach(([denseKey, entry]) => {
        const { fieldName } = entry2FieldName({ entry });
        const { method } = entry;

        const get = method === 'GET';
        const typeName = get ? 'Query' : 'Mutation';

        const inputTypeName = denseKey2InputTypeNameMap[denseKey];

        const result = entry2PartialDef({
            denseKey,
            entry,
            filteredInputModelMap,
            filteredModelMap,
            get,
            inputTypeName,
            method,
            preType2TypeValue,
            typeExists,
        });

        distribute(result, {
            ok: ({ partialDef, urlArgumentNameList }) => {
                (get ? Query : Mutation)[fieldName] = partialDef;
                urlArgumentMap[denseKey] = urlArgumentNameList;
            },
            errNoModel: () => {},
            errFilterName: (filterNameList) => {
                if (filterNameList.length > 0) {
                    console.log(
                        `[modelMap2TypeMap] Invalid filter names:`,
                        ...filterNameList,
                    );
                }
            },
            errFilterType: (infoList) => {
                ignoredFilterTypeInfo.push(
                    ...infoList.map((o) => ({ ...o, fieldName })),
                );
            },
            errTypeName: ({ typePath }) => {
                const message = [
                    `could not produce fieldType for entry: `,
                    `${fieldName} (${typePath})`,
                ].join('\n');
                console.log(`[error] ${message}`);
            },
            errMissingType: ({ fieldType }) => {
                exceptionObject.ignoredFieldSet.add(
                    `{ ${fieldType} :${fieldName} } ${typeName}`,
                );
            },
        });
    });

    // Note:
    // * `dense` is used to populate `Query`
    // `definitionScalarMap` and `existingScalarMap` are needed to get graphQl
    // type names and so as not to remove the fields with these types
    const { inputTypeMap, typeMap } = modelMap2TypeMap({
        filteredModelMap,
        filteredInputModelMap,
        Mutation,
        Query,
    });

    /// Logging ///
    report({
        invalidFieldNameInfo,
        exceptionObject,
        inputExceptionObject,
        ignoredFilterTypeInfo,
    });

    const typeDefs = typeMap2Graphql({
        definitionScalarMap,
        inputTypeMap,
        typeMap,
    });

    const { typeEntryMap } = dense2TypeEntryMap({ dense });
    const { resolvers } = resolverObj({
        dense,
        typeEntryMap,
        // inputTypeMap,
        urlArgumentMap,
        scalarTypeSet,
        typeMap,
    });

    // const graphqlJsonSchemaFileName = 'jsonSchema/graphql-ast.schema.json';
    // const graphqlJsonSchema = JSON.parse(
    //     await fs.readFile(graphqlJsonSchemaFileName, 'utf-8'),
    // );
    // validateGraphql(graphqlJsonSchema, typeDefs);

    if (true) {
        const gqlFile = 'tmp/out.gql';
        fs.writeFile(gqlFile, print(typeDefs), 'utf-8');
        console.log(`wrote file ${gqlFile}`);
    }

    /// Serve ///
    const server = new ApolloServer({
        typeDefs,
        resolvers,
    });

    const { url } = await server.listen();
    console.log(`🚀 Server ready at ${url}graphql (GraphQL playground)`);
};

run().catch((err): void => {
    const { stack, message, toJSON, name, toString, ...rest } = err;
    console.error(err.stack);
    console.log(...Object.entries(rest));
});
