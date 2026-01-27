import { filtrarOcorrenciasSuprimidas } from './suppressao.js';
export function comSupressaoInline(analista) {
    const aplicarOriginal = analista.aplicar;
    return {
        ...analista,
        aplicar: (src, relPath, ast, fullPath, contexto) => {
            const resultado = aplicarOriginal(src, relPath, ast, fullPath, contexto);
            if (resultado instanceof Promise) {
                return resultado.then((ocorrencias) => {
                    const arr = !ocorrencias
                        ? []
                        : Array.isArray(ocorrencias)
                            ? ocorrencias
                            : [ocorrencias];
                    return filtrarOcorrenciasSuprimidas(arr, analista.nome, src);
                });
            }
            const arr = !resultado
                ? []
                : Array.isArray(resultado)
                    ? resultado
                    : [resultado];
            return filtrarOcorrenciasSuprimidas(arr, analista.nome, src);
        },
    };
}
export function aplicarSupressaoAAnalistas(analistas) {
    return analistas.map(comSupressaoInline);
}
//# sourceMappingURL=analista-wrapper.js.map