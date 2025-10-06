# Performance Baseline - Day 7

**Date**: 2025-10-06
**Test Environment**: Vitest 3.2.4, Node.js
**Hardware**: WSL2 Linux

## Extraction Performance

### Small Email (~100 chars)
- **Iterations**: 50
- **Average**: 1.442ms
- **Median**: 1.277ms
- **Min**: 0.873ms
- **Max**: 3.079ms
- **Total**: 72.108ms

### Medium Email (~1KB)
- **Iterations**: 50
- **Average**: 1.861ms
- **Median**: 1.480ms
- **Min**: 1.059ms
- **Max**: 9.238ms
- **Total**: 93.041ms

### Large Email (~10KB)
- **Iterations**: 30
- **Average**: 7.490ms
- **Median**: 8.326ms
- **Min**: 4.956ms
- **Max**: 10.778ms
- **Total**: 224.705ms

### Rapid Extractions (10 consecutive)
- **Iterations**: 10
- **Average**: 9.433ms
- **Median**: 9.635ms
- **Min**: 6.006ms
- **Max**: 13.522ms
- **Total**: 94.325ms

## Analysis

### Current Performance Characteristics
1. **Small emails**: ~1.4ms average - very fast
2. **Medium emails**: ~1.9ms average - fast
3. **Large emails**: ~7.5ms average - acceptable
4. **Rapid extractions**: ~9.4ms for 10 emails - good throughput

### Scaling Behavior
- Performance scales roughly linearly with email size
- 10x email size (100 chars → 1KB) = ~1.3x slower (1.4ms → 1.9ms)
- 100x email size (100 chars → 10KB) = ~5.2x slower (1.4ms → 7.5ms)
- Good scaling characteristics - regex patterns are efficient

### Optimization Targets
Based on baseline, our Day 7 targets are:

| Metric | Baseline | Target (-20%) | Stretch (-30%) |
|--------|----------|---------------|----------------|
| Small email | 1.442ms | 1.154ms | 1.009ms |
| Medium email | 1.861ms | 1.489ms | 1.303ms |
| Large email | 7.490ms | 5.992ms | 5.243ms |
| 10 rapid | 9.433ms | 7.546ms | 6.603ms |

### Memory Usage
- Not measured in baseline (add in optimization phase)
- Expect minimal memory usage for small/medium emails
- Large emails may allocate more temporary strings during regex matching

## Next Steps
1. Profile regex patterns to identify bottlenecks
2. Optimize slow patterns
3. Implement caching for repeated extractions
4. Add React.memo to prevent unnecessary re-renders
5. Re-run benchmarks and compare
