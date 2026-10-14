/**
 * Depth dread — horror escalation with descent.
 *
 * MERIDIAN-9 is a descent: chamber c01 is near the surface, c12 sits on the
 * Seam. This module maps chamber id → 0..1 depth and derives every
 * depth-scaled horror parameter from it, so the deeper you go:
 *  - the Director never fully calms (tension floor rises, decay slows),
 *  - the Vessel gets faster and less tolerant of being stared at, holding
 *    its ground longer before retreating,
 *  - the screen grain / vignette / glitch reach further,
 *  - the facility mutters more often (shorter distant-clank intervals),
 *  - the air itself gets darker and thicker (light dim, fog boost).
 *
 * All functions are pure and clamped — safe to call every frame.
 */
import { CAMPAIGN } from '../world/chambers';

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/** 0 at c01 (surface) .. 1 at c12 (the Seam). Unknown/dev ids → 0. */
export function depthForChamber(chamberId: string): number {
  const i = CAMPAIGN.indexOf(chamberId);
  if (i < 0 || CAMPAIGN.length < 2) return 0;
  return clamp01(i / (CAMPAIGN.length - 1));
}

/** Calm floor the Director relaxes toward: 0 at the surface, 0.35 at the Seam. */
export function tensionFloorForDepth(depth: number): number {
  return clamp01(depth) * 0.35;
}

/** Tension decay rate (per second lerp factor base): 0.12 surface → 0.06 deep. */
export function decayRateForDepth(depth: number): number {
  return 0.12 * (1 - clamp01(depth) * 0.5);
}

/**
 * Vessel hunt speed m/s: 4.5 surface → 5.0 at the Seam.
 * Capped below the player sprint (5.2) so hunts stay escapable.
 */
export function huntSpeedForDepth(depth: number): number {
  return 4.5 + clamp01(depth) * 0.5;
}

/** Seconds of staring before a lurker retreats: 5 surface → 2.5 deep. */
export function stareToleranceForDepth(depth: number): number {
  return 5 - clamp01(depth) * 2.5;
}

/**
 * Lurk retreat range m: 4.5 surface → 3.0 deep.
 * Smaller = it holds its ground longer as you approach. Scarier.
 */
export function lurkRetreatForDepth(depth: number): number {
  return 4.5 - clamp01(depth) * 1.5;
}

/** Entity-proximity glitch radius m: 7 surface → 10 at the Seam. */
export function glitchRadiusForDepth(depth: number): number {
  return 7 + clamp01(depth) * 3;
}

/** Extra film grain from depth alone (added to tension grain): 0 → 0.03. */
export function grainBoostForDepth(depth: number): number {
  return clamp01(depth) * 0.03;
}

/** Extra vignette crush from depth alone: 0 → 0.12. */
export function vignetteBoostForDepth(depth: number): number {
  return clamp01(depth) * 0.12;
}

/** Ambient/hemi light multiplier: 1 surface → 0.65 at the Seam. */
export function lightDimForDepth(depth: number): number {
  return 1 - clamp01(depth) * 0.35;
}

/** Additive fog density: +0 at surface → +0.03 at the Seam (Silent Hill murk). */
export function fogBoostForDepth(depth: number): number {
  return clamp01(depth) * 0.03;
}

/** Random distant-clank delay window [min, min+span] seconds. */
export function clankWindowForDepth(depth: number): { min: number; span: number } {
  const d = clamp01(depth);
  return { min: 9 - 5 * d, span: 18 - 8 * d };
}
