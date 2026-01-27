export function createLineLookup(src) {
    const newlineIndexes = [];
    for (let i = 0; i < src.length; i++) {
        if (src.charCodeAt(i) === 10)
            newlineIndexes.push(i);
    }
    const lineAt = (index) => {
        if (!index || index <= 0)
            return 1;
        const i = Math.min(src.length, Math.max(0, index));
        let lo = 0;
        let hi = newlineIndexes.length;
        while (lo < hi) {
            const mid = (lo + hi) >>> 1;
            if (newlineIndexes[mid] < i)
                lo = mid + 1;
            else
                hi = mid;
        }
        return lo + 1;
    };
    return { lineAt };
}
//# sourceMappingURL=line-lookup.js.map