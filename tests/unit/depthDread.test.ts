import { describe, expect, it } from 'vitest';
import {
  clankWindowForDepth,
  decayRateForDepth,
  depthForChamber,
  fogBoostForDepth,
  glitchRadiusForDepth,
  grainBoostForDepth,
  huntSpeedForDepth,
  lightDimForDepth,
  lurkRetreatForDepth,
  stareToleranceForDepth,
  tensionFloorForDepth,
  vignetteBoostForDepth,
} from '../../src/entity/DepthDread';

describe('DepthDread', () => {
  it('maps c01 → 0 and c12 → 1, monotonic in between', () => {
    expect(depthForChamber('c01')).toBe(0);
    expect(depthForChamber('c12')).toBe(1);
    const mid = depthForChamber('c06');
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
    expect(depthForChamber('c07')).toBeGreaterThan(mid);
    expect(depthForChamber('dev')).toBe(0);
    expect(depthForChamber('nope')).toBe(0);
  });

  it('escalates dread with depth', () => {
    expect(tensionFloorForDepth(1)).toBeGreaterThan(tensionFloorForDepth(0));
    expect(decayRateForDepth(1)).toBeLessThan(decayRateForDepth(0));
    expect(huntSpeedForDepth(1)).toBeGreaterThan(huntSpeedForDepth(0));
    expect(stareToleranceForDepth(1)).toBeLessThan(stareToleranceForDepth(0));
    expect(lurkRetreatForDepth(1)).toBeLessThan(lurkRetreatForDepth(0));
    expect(glitchRadiusForDepth(1)).toBeGreaterThan(glitchRadiusForDepth(0));
    expect(grainBoostForDepth(1)).toBeGreaterThan(grainBoostForDepth(0));
    expect(vignetteBoostForDepth(1)).toBeGreaterThan(vignetteBoostForDepth(0));
    expect(lightDimForDepth(1)).toBeLessThan(lightDimForDepth(0));
    expect(fogBoostForDepth(1)).toBeGreaterThan(fogBoostForDepth(0));
  });

  it('keeps hunts escapable (below player sprint 5.2 m/s)', () => {
    expect(huntSpeedForDepth(1)).toBeLessThan(5.2);
  });

  it('quiets the facility less often near the surface, more often deep', () => {
    const top = clankWindowForDepth(0);
    const deep = clankWindowForDepth(1);
    expect(deep.min + deep.span).toBeLessThan(top.min + top.span);
  });

  it('clamps out-of-range depths', () => {
    expect(tensionFloorForDepth(-1)).toBe(tensionFloorForDepth(0));
    expect(tensionFloorForDepth(2)).toBe(tensionFloorForDepth(1));
    expect(huntSpeedForDepth(2)).toBe(huntSpeedForDepth(1));
  });
});
