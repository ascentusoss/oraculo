import { comandoAnalistas, comandoAtualizar, comandoDiagnosticar, comandoFormatar, comandoGuardian, comandoMetricas, comandoOtimizarSvg, comandoPodar, comandoReestruturar, criarComandoFixTypes, registrarComandoReverter, } from './commands/index.js';
export function registrarComandos(program, aplicarFlagsGlobais) {
    program.addCommand(comandoDiagnosticar(aplicarFlagsGlobais));
    program.addCommand(comandoGuardian(aplicarFlagsGlobais));
    program.addCommand(comandoFormatar(aplicarFlagsGlobais));
    program.addCommand(comandoOtimizarSvg(aplicarFlagsGlobais));
    program.addCommand(comandoPodar(aplicarFlagsGlobais));
    program.addCommand(comandoReestruturar(aplicarFlagsGlobais));
    program.addCommand(comandoAtualizar(aplicarFlagsGlobais));
    program.addCommand(comandoAnalistas());
    program.addCommand(comandoMetricas());
    program.addCommand(criarComandoFixTypes());
    registrarComandoReverter(program);
}
if (false)
    0;
//# sourceMappingURL=comandos.js.map