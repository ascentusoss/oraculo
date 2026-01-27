export { LogContextConfig } from '../../../core/messages/log/log-messages.js';
export function temCapacidadeBloco(log) {
    return (typeof log === 'object' &&
        log !== null &&
        'imprimirBloco' in log &&
        typeof log.imprimirBloco === 'function');
}
export function temCapacidadeSanitizar(log) {
    return typeof log === 'object' && log !== null && 'infoSemSanitizar' in log;
}
//# sourceMappingURL=log.js.map