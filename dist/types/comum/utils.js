export function isBabelNode(obj) {
    return (typeof obj === 'object' &&
        obj !== null &&
        typeof obj.type === 'string');
}
//# sourceMappingURL=utils.js.map