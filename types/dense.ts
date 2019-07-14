import { scalar, RecStr } from './util';

export interface DenseFilterField {
    dataType: string;
    default?: scalar;
    description?: string;
    pattern: string;
    requirement: string;
}

export type DenseFilter = RecStr<DenseFilterField>;

export interface DenseField {
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

export interface DenseModel {
    [dottedName: string]: DenseField;
}

export interface DenseParameter {
    [dottedName: string]: DenseField;
}

export interface DenseResponse {
    [dottedName: string]: DenseField;
}

export interface DenseClassInput {
    typePath: string;
    options: RecStr<string | boolean>;
}

export interface DenseEntry {
    apiModes: string[];
    apiTags: string[];
    authentication: boolean;
    category: string;
    classInput?: DenseClassInput;
    classOutput: string;
    deprecated: boolean;
    description: string;
    documentation: string;
    filters: DenseFilter;
    https: boolean;
    id: string;
    method: string;
    parameters: DenseParameter;
    parsed?: {
        typePath: string;
        collection?: boolean;
        collectionName?: string;
        model: DenseModel;
    };
    response: DenseResponse;
    statusCodes: {
        [statusCode: number]: [string];
    };
    section: string;
    tags: {
        [tagName: string]: string;
    };
    uri: string;
}

export type Dense = RecStr<DenseEntry>;
