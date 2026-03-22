// Logic to adjust bin size for conditions A and C
function adjustBinSizeForCondition(level, condition) {
    // Only adjust the bins on the right (all bins) for A or C
    if (condition === 'A' || condition === 'C') {
        if (Array.isArray(level.bins)) {
            for (let bin of level.bins) {
                bin.xLen = (bin.xLen || 0) + 1;
                bin.yLen = (bin.yLen || 0) + 1;
            }
        } else if (typeof level.binXLen === 'number' && typeof level.binYLen === 'number') {
            level.binXLen += 1;
            level.binYLen += 1;
        }
    }
    return level;
}
