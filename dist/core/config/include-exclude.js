import micromatch from 'micromatch';
export function shouldInclude(relPath, entry, config) {
    if (Array.isArray(config.globalExcludeGlob) &&
        config.globalExcludeGlob.length > 0 &&
        micromatch.isMatch(relPath, config.globalExcludeGlob)) {
        return false;
    }
    return true;
}
//# sourceMappingURL=include-exclude.js.map