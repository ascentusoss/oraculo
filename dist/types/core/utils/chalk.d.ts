export type StyleName = 'cyan' | 'green' | 'red' | 'yellow' | 'magenta' | 'bold' | 'gray' | 'dim';
export interface StyleFn {
    (s: string): string;
    cyan?: StyleFn;
    green?: StyleFn;
    red?: StyleFn;
    yellow?: StyleFn;
    magenta?: StyleFn;
    bold?: StyleFn;
    gray?: StyleFn;
    dim?: StyleFn;
}
export interface ChalkLike {
    cyan: StyleFn;
    green: StyleFn;
    red: StyleFn;
    yellow: StyleFn;
    magenta: StyleFn;
    bold: StyleFn;
    gray: StyleFn;
    dim: StyleFn;
}
//# sourceMappingURL=chalk.d.ts.map