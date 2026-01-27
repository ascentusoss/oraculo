let _jsonModeAtivo = false;
export function ativarModoJson() {
    _jsonModeAtivo = true;
}
export function desativarModoJson() {
    _jsonModeAtivo = false;
}
export function isJsonMode() {
    return _jsonModeAtivo;
}
export function resetJsonMode() {
    _jsonModeAtivo = false;
}
//# sourceMappingURL=json-mode.js.map