import { GraphQLResolveInfo } from 'graphql';
import { RecStr } from './util';

export type ResolverObject<T = any> = RecStr<RecStr<T>> & {
    Query: RecStr<T>;
};

export type ResolverFunction = (
    parent: { [key: string]: any },
    args: { [key: string]: any },
    ctx: any,
    info: GraphQLResolveInfo,
) => any;
