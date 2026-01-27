import { logConselheiro } from '../core/messages/index.js';
export function emitirConselhoOracular(estresse) {
    const { hora = new Date().getHours(), arquivosParaCorrigir = 0, arquivosParaPodar = 0, } = estresse;
    const madrugada = hora >= 23 || hora < 4;
    const muitosArquivos = arquivosParaCorrigir > 200 || arquivosParaPodar > 200;
    if (!madrugada && !muitosArquivos)
        return;
    logConselheiro.respira();
    if (madrugada) {
        const horaRef = hora >= 2 && hora < 3 ? '2h' : `${hora}h`;
        logConselheiro.madrugada(horaRef);
    }
    if (muitosArquivos) {
        logConselheiro.volumeAlto();
    }
    logConselheiro.cuidado();
}
//# sourceMappingURL=conselheiro-oracular.js.map