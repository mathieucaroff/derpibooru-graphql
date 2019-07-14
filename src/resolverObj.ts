// Create the resolvers from the GraphQL schema and the entry point mapping
import { URL } from 'url';
import fetch, { Response, RequestInit } from 'node-fetch';

// Types
import {
    TypeNode,
    NamedTypeNode,
    ListTypeNode,
    NonNullTypeNode,
} from 'graphql';

import { TypeEntryMap } from './step';

import {
    ResolverObject,
    ResolverFunction,
    TypeMap,
    Dense,
    RecStr,
    PartialFieldDefinition,
} from '../types';
import ono from 'ono';

// A Util A //
type Async = (a: unknown) => Promise<any>;

type Mapper = (f: Async, data: any) => Promise<any>;

const apply = async (f: Async, id: number) => await f(id); // Level 0

let higher = (mapper: Mapper): Mapper => {
    // (Level) => Lever + 1
    return async (f: (a: unknown) => Promise<any>, idData: any[]) => {
        const rescueF = async (a: unknown) => {
            const resucePromise = f(a).catch((err) => {
                console.error(err);
                return null;
            });
            return await resucePromise;
        };
        const result = await Promise.all(idData.map(rescueF));
        return result;
    };
};
// V Util V //

const baseURL = 'http://site38727.deskprodemo.com/api/v2';

const authJsonFetch = async (
    url: string,
    init: RequestInit = {},
    qs: RecStr<string> = {},
) => {
    const urlObj = new URL(url);
    Object.entries(qs).forEach(([key, value]) => {
        urlObj.searchParams.append(key, value);
    });
    console.log('url', url);

    const res: Response = await fetch(`${urlObj}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'key 1:dev-admin-code',
            ...((init as any).headers || {}),
        },
    });

    // quick fix
    if (res.status === 204) {
        return { id: 0 };
    }

    let json = await res.json();
    // console.log('json', json);
    let { data }: any = json;
    // console.log('data', data);
    if (data instanceof Array) {
        data = data.filter((el) => el);
    }
    return data;
};

type FormatUrl = (param: {
    argObj: { [x: string]: any };
    urlArgumentList: string[];
    urlSchema: string;
}) => string;

const formatUrl: FormatUrl = ({ argObj, urlArgumentList, urlSchema }) => {
    let url = urlSchema;

    urlArgumentList.forEach((name) => {
        const pattern = `{${name}}`;
        url = url.replace(pattern, argObj[name]);
    });

    return url;
};

type MakeResolver = (param: {
    fieldName: string;
    method: string;
    uri: string;
    urlArgumentList: string[];
}) => ResolverFunction;

const makeResolver: MakeResolver = ({
    fieldName,
    method,
    uri,
    urlArgumentList,
}) => {
    const urlSchema = `${baseURL}/${uri}`;

    return async (parent, argObjArg) => {
        const url = formatUrl({
            urlArgumentList,
            urlSchema,
            argObj: argObjArg,
        });

        const argObj = { ...argObjArg };
        urlArgumentList.forEach((name) => {
            delete argObj[name];
        });

        console.log(method, fieldName);

        let data: unknown = 0;
        if (method === 'GET') {
            data = await authJsonFetch(url, {}, argObj);
        } else if ('POST PUT PATCH'.includes(method)) {
            const { id } = await authJsonFetch(
                url,
                { method, body: JSON.stringify(argObj.data) },
                {},
            );
            data = id;
            if (method === 'PUT') {
                return false;
            }
        } else if (method === 'DELETE') {
            await authJsonFetch(url, { method }, {});
            return false;
        } else {
            console.log(`[resolverObj] Unhandled method ${method}`);
        }

        return data;
    };
};

/**
 * @param typeMap
 * An object mapping type names to their description. The latter is an
 * object mapping fields to their types. The type of a field is a
 * GraphQl TypeNode.
 *
 * @param entryMap
 * An object mapping type names to their an entry point object. The latter
 * describes how to get all instances of a type and how to get one by id.
 *
 */
type ResolverObj = (param: {
    dense: Dense;
    typeEntryMap: TypeEntryMap;
    urlArgumentMap: RecStr<string[]>;
    scalarTypeSet: Set<string>;
    typeMap: TypeMap;
}) => { resolvers: ResolverObject<ResolverFunction> };

export const resolverObj: ResolverObj = ({
    dense,
    typeEntryMap,
    urlArgumentMap,
    scalarTypeSet,
    typeMap,
}) => {
    const Query: RecStr<ResolverFunction> = {};
    const Mutation: RecStr<ResolverFunction> = {};

    const resolvers: ResolverObject<ResolverFunction> = {
        Query,
        Mutation,
    };

    let ignoredTypeList: string[] = [];
    let ignoredFieldTypeMap: RecStr<unknown> = {};

    const populateType = (typeObj: RecStr<ResolverFunction>) => ([
        fieldName,
        fieldType,
    ]: [string, PartialFieldDefinition]): void => {
        const { denseKey } = fieldType;
        const entry = dense[denseKey];
        const { method, uri } = entry;
        const urlArgumentList = urlArgumentMap[denseKey];
        typeObj[fieldName] = makeResolver({
            fieldName,
            method,
            uri,
            urlArgumentList,
        });
    };

    // Query fields //
    Object.entries(typeMap.Query).forEach(populateType(Query));

    // Mutation fields //
    Object.entries(typeMap.Mutation).forEach(populateType(Mutation));

    // Query sub-entries //
    Object.entries(typeMap).forEach(([typeName, fieldObj]) => {
        if (['Query', 'Mutation'].includes(typeName)) {
            return;
        }
        Object.entries(fieldObj).forEach(([fieldName, fieldType]) => {
            let typeNode: TypeNode = fieldType.type;
            let fieldTypeName: string | undefined = undefined;
            let j = 0;
            let map = apply;
            while (fieldTypeName === undefined) {
                ((key) => (o: any) => o[key])(typeNode.kind)({
                    NamedType: (node: NamedTypeNode) => {
                        fieldTypeName = node.name.value;
                    },
                    ListType: (node: ListTypeNode) => {
                        typeNode = node.type;
                        map = higher(map);
                    },
                    NonNullType: (node: NonNullTypeNode) => {
                        typeNode = node.type;
                    },
                })(typeNode);
                if (++j > 10) {
                    throw ono('Cannot find typeNode.name', {
                        fieldName,
                        fieldType,
                    });
                }
            }

            const entry = typeEntryMap[fieldTypeName];
            try {
                var { uri, denseKey } = entry.getIdEntry();
            } catch {
                ignoredFieldTypeMap[fieldTypeName] = true;
                return;
            }

            const urlSchema = `${baseURL}/${uri}`;

            const typeIdResolver = async (id: number | null) => {
                if (id === null) {
                    return null;
                } else if (!id) {
                    console.error(`[typeIdResolver] !id: (${id})`);
                    return null;
                }

                const url = formatUrl({
                    argObj: { id },
                    urlSchema,
                    urlArgumentList: ['id'],
                });

                const data = await authJsonFetch(url, {}, {});
                return data;
            };

            // Field Resolver Function //
            const fieldResolver: ResolverFunction = async (parent) => {
                const idData = parent[fieldName];
                console.log('Resolver:', fieldName, idData);
                return await map(typeIdResolver, idData);
            };

            resolvers[typeName] = resolvers[typeName] || {};

            resolvers[typeName][fieldName] = fieldResolver;
        });
    });

    scalarTypeSet.forEach((key) => {
        delete ignoredFieldTypeMap[key];
    });
    const ignoredFieldTypeNameList = Object.keys(ignoredFieldTypeMap).sort();
    console.log('[resolverObj] ignoredTypeNameList', ignoredTypeList);
    console.log(
        '[resolverObj] ignoredFieldTypeNameList',
        ignoredFieldTypeNameList,
    );

    return { resolvers };
};
