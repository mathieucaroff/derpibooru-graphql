import { scalar, RecStr } from './util';

export interface DumpFilterField {
    dataType: string;
    default?: scalar;
    description?: string;
    pattern: string;
    requirement: string;
}

export type DumpFilter = RecStr<DumpFilterField>;

export interface DumpRequirementField {
    dataType: string;
    description: string;
    requirement: string;
}

export type DumpRequirement = RecStr<DumpRequirementField>;

export interface DumpField {
    dataType: string | null;
    readonly: boolean | null;
    required: boolean | null;
    default: scalar | scalar[] | null;
    description: string | null;
    format: string | null;
    sinceVersion: string | null;
    untilVersion: string | null;
    actualType: string | null;
    subType: string | null;
}

export interface DumpEntryTypeObject {
    class: string;
    groups: unknown[]; // No value found in the .json dump
    options: unknown[]; // ~~No value found in the .json dump~~
    collection?: boolean;
    collectionName?: string;
}

// "$ref": "#/definitions/DumpParameter",
export interface DumpDottedNameFieldObject {
    [dottedName: string]: DumpField;
}

export type DumpReponse = DumpDottedNameFieldObject;
export type DumpParameter = DumpDottedNameFieldObject;
export type DumpModel = DumpDottedNameFieldObject;

export interface DumpClassInput {
    class: string;
    options?: RecStr<string | boolean>;
}

export interface DumpEntry {
    apiModes: string[];
    apiTags: string[];
    authentication: boolean;
    authenticationRoles: unknown[]; // No value found in the .json dump
    classInput: DumpClassInput | string | null; // (but it's probably better as it is)
    classOutput: string | null;
    deprecated: boolean;
    description?: string;
    documentation?: string;
    filters?: DumpFilter;
    https: boolean;
    id: string;
    method: string;
    parameters?: DumpParameter;
    parsedResponseMap?: {
        [200]: {
            // INLINEABLE
            // Funny shape (^-^)
            type: DumpEntryTypeObject; // INLINEABLE
            model: DumpModel | [];
        };
    };
    requirements?: DumpRequirement;
    resourceDescription?: string;
    response?: DumpReponse;
    section: string;
    statusCodes?: {
        [statusCode: number]: [string];
    };
    tags?: {
        [tagName: string]: string;
    };
    target: unknown; // No value found in the .json dump
    uri: string;
}

export interface Dump {
    [category: string]: { others: DumpEntry[] }; // INLINEABLE
}
