import type { Comment, Node } from '@babel/types';
export type AstBodyNode = Node | Node[] | null | undefined;
export type FileLike = {
    path?: string;
    ast?: Node | null;
    node?: {
        type?: string;
        body?: AstBodyNode;
        loc?: {
            start?: {
                line?: number | null;
            };
            end?: {
                line?: number | null;
            };
        } | null;
    } | null;
    type?: string;
    body?: AstBodyNode;
    loc?: {
        start?: {
            line?: number | null;
        };
        end?: {
            line?: number | null;
        };
    } | null;
};
export type FunctionLikeNode = {
    loc?: {
        start?: {
            line?: number | null;
        };
        end?: {
            line?: number | null;
        };
    } | null;
    params?: Node[] | null;
    leadingComments?: Comment[] | null;
    body?: AstBodyNode;
};
//# sourceMappingURL=babel-narrow.d.ts.map