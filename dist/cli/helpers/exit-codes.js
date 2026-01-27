export var ExitCode;
(function (ExitCode) {
    ExitCode[ExitCode["Ok"] = 0] = "Ok";
    ExitCode[ExitCode["Failure"] = 1] = "Failure";
    ExitCode[ExitCode["Critical"] = 2] = "Critical";
    ExitCode[ExitCode["InvalidUsage"] = 3] = "InvalidUsage";
})(ExitCode || (ExitCode = {}));
export function sair(codigo) {
    if (!process.env.VITEST) {
        process.exit(codigo);
    }
    else {
        process.exitCode = codigo;
    }
}
//# sourceMappingURL=exit-codes.js.map