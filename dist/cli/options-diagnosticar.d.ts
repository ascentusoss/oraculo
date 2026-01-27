type OptionBase = {
    flags: string;
    desc: string;
};
type OptionWithParser = OptionBase & {
    parser: (val: string, prev: string[]) => string[];
    defaultValue: string[];
};
type OptionWithDefault = OptionBase & {
    defaultValue: boolean | string;
};
type OptionSimple = OptionBase;
type DiagnosticarOption = OptionWithParser | OptionWithDefault | OptionSimple;
export declare const optionsDiagnosticar: DiagnosticarOption[];
export {};
//# sourceMappingURL=options-diagnosticar.d.ts.map