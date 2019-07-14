import { InputValueDefinitionNode, TypeNode } from 'graphql';

import { ResolverObject } from './resolver';
import { DenseModel } from './dense';
import { RecStr } from './util';

export interface DenseModelInfo {
    denseKey: string;
    model: DenseModel;
}

export interface DenseModelMap {
    [typeName: string]: DenseModelInfo;
}

export interface PartialFieldDefinition {
    argumentList: InputValueDefinitionNode[];
    denseKey: string;
    description?: string;
    type: TypeNode;
}

export interface PartialInputFieldDefinition {
    type: TypeNode;
    denseKey: string;
    description?: string;
}

export type FieldObj = RecStr<PartialFieldDefinition>;

export type TypeMap = ResolverObject<PartialFieldDefinition>;

export interface InputTypeMap {
    [inputTypeName: string]: {
        [fieldName: string]: PartialInputFieldDefinition;
    };
}

export type TypeExists = (type: string, map: RecStr<unknown>) => boolean;
