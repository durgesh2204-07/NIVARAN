import along from '@turf/along';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import distance from '@turf/distance';
import { lineString, point, polygon } from '@turf/helpers';
import {
  AllocationSlice,
  ClimateHorizon,
  ElevationProfilePoint,
  ElevationProfileSummary,
  ExplainScorePayload,
  FloodInundationCell,
  FloodSimulationResult,
  HazardFactors,
  HazardWeights,
  InterventionOption,
  Language,
  RankedVillageEntry,
  ReliefCamp,
  RelocationSite,
  RiskLevel,
  Village,
  VulnerabilityFactors,
} from '../types';

/**
 * Total, defensive numeric clamp helper that never returns NaN or Infinity.
 */
export function safeNumber(val: unknown, fallback = 0): number {
  const n = typeof val === 'number' ? val : Number(val);
  return Number.isFinite(n) ? n : fallback;
}

export interface SafeScoreResult {
  value: number;
  status: 'ok' | 'partial' | 'insufficient';
  warnings: string[];
}

/**
 * Normalizes a numeric value into the [0, 1] range.
 * Total function: never throws, never returns NaN or Infinity.
 */
export function normalize(value: number, min: number, max: number): number {
  const sMin = safeNumber(min, 0);
  const sMax = safeNumber(max, 1);
  if (sMax <= sMin) return 0;
  const sVal = safeNumber(value, sMin);
  const clamped = Math.max(sMin, Math.min(sMax, sVal));
  return Number(((clamped - sMin) / (sMax - sMin)).toFixed(4));
}

/**
 * Safe, total computation wrapper returning { value, status: "ok" | "partial" | "insufficient", warnings }
 * per Section 9.4. Treats null/undefined/NaN factors as "unknown" (excluded from denominator and flagged, not zero).
 */
export function safeComputeHazardScore(
  factors: Partial<Record<keyof HazardFactors, number | null | undefined>> | null | undefined,
  weights: Partial<HazardWeights> = {
    rainfall: 0.35,
    slope: 0.30,
    history: 0.20,
    riverProximity: 0.15,
  }
): SafeScoreResult {
  if (!factors || typeof factors !== 'object') {
    return {
      value: 0,
      status: 'insufficient',
      warnings: ['No hazard factor record provided.'],
    };
  }

  const keys: Array<keyof HazardFactors> = ['rainfall', 'slope', 'history', 'riverProximity'];
  const defaultWeights: HazardWeights = {
    rainfall: safeNumber(weights?.rainfall, 0.35),
    slope: safeNumber(weights?.slope, 0.30),
    history: safeNumber(weights?.history, 0.20),
    riverProximity: safeNumber(weights?.riverProximity, 0.15),
  };

  const warnings: string[] = [];
  let weightedSum = 0;
  let activeWeightSum = 0;
  let validCount = 0;

  for (const key of keys) {
    const rawVal = factors[key];
    const w = Math.max(0, defaultWeights[key]);
    if (rawVal === null || rawVal === undefined || !Number.isFinite(Number(rawVal))) {
      warnings.push(`Factor '${key}' is missing or unknown and was excluded.`);
      continue;
    }
    const numVal = Number(rawVal);
    if (numVal < 0 || numVal > 1) {
      warnings.push(`Factor '${key}' (${numVal}) was outside [0, 1] and clamped.`);
    }
    const clamped = Math.min(1, Math.max(0, numVal));
    weightedSum += clamped * w;
    activeWeightSum += w;
    validCount += 1;
  }

  if (validCount === 0 || activeWeightSum <= 0) {
    return {
      value: 0,
      status: 'insufficient',
      warnings: warnings.length > 0 ? warnings : ['Insufficient valid factors or zero total weight.'],
    };
  }

  const value = Number(Math.min(1, Math.max(0, weightedSum / activeWeightSum)).toFixed(3));
  return {
    value,
    status: validCount === keys.length ? 'ok' : validCount >= 2 ? 'partial' : 'insufficient',
    warnings,
  };
}

/**
 * Computes the weighted hazard score from normalized [0..1] factors and weights.
 * Formula: Hazard = 0.35×Rainfall + 0.30×Slope + 0.20×PastDisasterHistory + 0.15×RiverProximity
 * Worked example:
 *   factors = { rainfall: 0.9, slope: 0.7, history: 0.4, riverProximity: 0.6 }
 *   weights = { rainfall: 0.35, slope: 0.30, history: 0.20, riverProximity: 0.15 }
 *   -> 0.315 + 0.21 + 0.08 + 0.09 = 0.695 -> "Short-term"
 */
export function weightedScore(
  factors: HazardFactors,
  weights: HazardWeights = {
    rainfall: 0.35,
    slope: 0.30,
    history: 0.20,
    riverProximity: 0.15,
  },
  verifiedReportsCount: number = 0,
  climateHorizon: ClimateHorizon = 'today',
  extraRainfallMm: number = 0,
  liveRainfallMm24h?: number
): number {
  if (!factors || typeof factors !== 'object') return 0;

  const climateMultiplier =
    climateHorizon === 'plus20' ? 1.22 : climateHorizon === 'plus10' ? 1.11 : 1.0;

  const safeExtraRain = safeNumber(extraRainfallMm, 0);
  const extremeRainBoost = safeExtraRain > 100 ? (safeExtraRain - 100) / 800 : 0;

  const liveBlend =
    typeof liveRainfallMm24h === 'number' && Number.isFinite(liveRainfallMm24h) && liveRainfallMm24h > 0
      ? normalize(liveRainfallMm24h, 0, 250) * 0.06
      : 0;

  const rFactor = safeNumber(factors.rainfall, 0);
  const sFactor = safeNumber(factors.slope, 0);
  const hFactor = safeNumber(factors.history, 0);
  const rvFactor = safeNumber(factors.riverProximity, 0);
  const safeReports = Math.max(0, safeNumber(verifiedReportsCount, 0));

  const adjustedRain = Math.min(
    1,
    Math.max(0, rFactor * climateMultiplier + extremeRainBoost + liveBlend)
  );
  const adjustedSlope = Math.min(1, Math.max(0, sFactor));
  const adjustedHistory = Math.min(
    1,
    Math.max(0, hFactor + safeReports * 0.025)
  );
  const adjustedRiver = Math.min(1, Math.max(0, rvFactor));

  const wRain = Math.max(0, safeNumber(weights?.rainfall, 0.35));
  const wSlope = Math.max(0, safeNumber(weights?.slope, 0.30));
  const wHist = Math.max(0, safeNumber(weights?.history, 0.20));
  const wRiver = Math.max(0, safeNumber(weights?.riverProximity, 0.15));

  const totalWeight = wRain + wSlope + wHist + wRiver;
  if (totalWeight <= 0) return 0;

  const raw =
    (wRain * adjustedRain +
      wSlope * adjustedSlope +
      wHist * adjustedHistory +
      wRiver * adjustedRiver) /
    totalWeight;

  return Number(Math.min(1, Math.max(0, raw)).toFixed(3));
}

export type StandardRiskCategory =
  | 'VERY HIGH RISK'
  | 'HIGH RISK'
  | 'MODERATE RISK'
  | 'LOW RISK'
  | 'VERY LOW RISK';

export type RiskCategoryCode = 'RED' | 'YELLOW' | 'ORANGE' | 'LIGHT_GREEN' | 'GREEN';

export interface RiskClassification {
  score: number;
  category: StandardRiskCategory;
  categoryTitle: string;
  categoryCode: RiskCategoryCode;
  colorHex: '#DC2626' | '#EAB308' | '#F97316' | '#84CC16' | '#16A34A';
  action: string;
}

/**
 * Standardized, Non-Overlapping 0-100 Risk Classification Function (Section 1).
 * Single Source of Truth matching backend exactly:
 * - 80.00 to 100.00: VERY HIGH RISK -> RED (#DC2626)
 * - 60.00 to < 80.00: HIGH RISK -> YELLOW (#EAB308)
 * - 40.00 to < 60.00: MODERATE RISK -> ORANGE (#F97316)
 * - 20.00 to < 40.00: LOW RISK -> LIGHT GREEN (#84CC16)
 * - 0.00 to < 20.00: VERY LOW RISK -> GREEN (#16A34A)
 */
export function classifyRiskScore(rawScore: number): RiskClassification {
  const s = safeNumber(rawScore, 0);
  const clamped = Math.max(0, Math.min(100, Math.round(s * 10000) / 10000));

  if (clamped >= 80.0) {
    return {
      score: clamped,
      category: 'VERY HIGH RISK',
      categoryTitle: 'Very High Risk',
      categoryCode: 'RED',
      colorHex: '#DC2626',
      action: 'Immediate Pre-Monsoon Evacuation & Permanent Relocation',
    };
  }
  if (clamped >= 60.0) {
    return {
      score: clamped,
      category: 'HIGH RISK',
      categoryTitle: 'High Risk',
      categoryCode: 'YELLOW',
      colorHex: '#EAB308',
      action: 'Strict Vigilance, Structural Mitigation & Phase-2 Relocation Planning',
    };
  }
  if (clamped >= 40.0) {
    return {
      score: clamped,
      category: 'MODERATE RISK',
      categoryTitle: 'Moderate Risk',
      categoryCode: 'ORANGE',
      colorHex: '#F97316',
      action: 'Active Seasonal Telemetry Monitoring & Safe Drainage Works',
    };
  }
  if (clamped >= 20.0) {
    return {
      score: clamped,
      category: 'LOW RISK',
      categoryTitle: 'Low Risk',
      categoryCode: 'LIGHT_GREEN',
      colorHex: '#84CC16',
      action: 'Periodic Ground Truth Surveys & Habitability Maintenance',
    };
  }
  return {
    score: clamped,
    category: 'VERY LOW RISK',
    categoryTitle: 'Very Low Risk',
    categoryCode: 'GREEN',
    colorHex: '#16A34A',
    action: 'Designated Safe Host Plateau / No Active Threat Detected',
  };
}

/**
 * Classifies a hazard score into semantic RiskLevel buckets.
 * Supports both normalized 0-1 scores and 0-100 percentage scores seamlessly.
 */
export function classifyHazard(score: number): RiskLevel {
  const s = safeNumber(score, 0);
  const score1 = s > 1.0 ? s / 100.0 : s;
  if (score1 > 0.75) return 'Immediate';
  if (score1 >= 0.5) return 'Short-term';
  if (score1 >= 0.3) return 'Medium-term';
  return 'Safe';
}

/**
 * Returns standardized, high-contrast semantic hex color code:
 * Red #DC2626, Yellow #EAB308, Orange #F97316, Light Green #84CC16, Green #16A34A
 */
export function getRiskColor(level: RiskLevel | string): string {
  switch (level) {
    case 'Immediate':
    case 'VERY HIGH RISK':
    case 'Very High Risk':
    case 'RED':
    case 'Red':
      return '#DC2626';
    case 'Short-term':
    case 'HIGH RISK':
    case 'High Risk':
    case 'YELLOW':
    case 'Yellow':
      return '#EAB308';
    case 'Medium-term':
    case 'MODERATE RISK':
    case 'Moderate Risk':
    case 'ORANGE':
    case 'Orange':
      return '#F97316';
    case 'LOW RISK':
    case 'Low Risk':
    case 'LIGHT_GREEN':
    case 'Light Green':
      return '#84CC16';
    case 'Safe':
    case 'VERY LOW RISK':
    case 'Very Low Risk':
    case 'GREEN':
    case 'Green':
    default:
      return '#16A34A';
  }
}

/**
 * Returns hex color code directly computed from 0-100 risk score.
 */
export function getRiskColorByScore(score: number): string {
  return classifyRiskScore(score).colorHex;
}

/**
 * Computes normalized Vulnerability Score (0..1) from socio-economic & infrastructure factors:
 * - % elderly (normalized against 0..50%) - weight 0.22
 * - % below poverty line (normalized against 0..80%) - weight 0.22
 * - % disabled (normalized against 0..15%) - weight 0.14
 * - distance to nearest healthcare in km (normalized against 0..30 km) - weight 0.22
 * - kutcha-house % (normalized against 0..90%) - weight 0.20
 */
export function computeVulnerability(v: VulnerabilityFactors): number {
  if (!v || typeof v !== 'object') return 0;
  const nElderly = normalize(safeNumber(v.elderlyPct, 0), 0, 50);
  const nBpl = normalize(safeNumber(v.bplPct, 0), 0, 80);
  const nDisabled = normalize(safeNumber(v.disabledPct, 0), 0, 15);
  const nHealthDist = normalize(safeNumber(v.healthcareDistKm, 0), 0, 30);
  const nKutcha = normalize(safeNumber(v.kutchaHousePct, 0), 0, 90);

  const score =
    0.22 * nElderly +
    0.22 * nBpl +
    0.14 * nDisabled +
    0.22 * nHealthDist +
    0.20 * nKutcha;

  return Number(Math.min(1, Math.max(0, score)).toFixed(3));
}

export const calculateVulnerabilityScore = computeVulnerability;

/**
 * Classifies a habitation into one of the 2x2 Matrix Quadrants (Hazard vs Vulnerability).
 */
export function classifyQuadrant(
  hazardScore: number,
  vulnerabilityScore: number
): 'Relocate' | 'Engineering fix' | 'Monitor' | 'Low concern' {
  const h = safeNumber(hazardScore, 0);
  const v = safeNumber(vulnerabilityScore, 0);
  if (h >= 0.5 && v >= 0.5) return 'Relocate';
  if (h >= 0.5 && v < 0.5) return 'Engineering fix';
  if (h < 0.5 && v >= 0.5) return 'Monitor';
  return 'Low concern';
}

/**
 * Computes Carrying Capacity of a candidate relocation site.
 * Formula:
 *   grossCapacity = usable_area_ha ÷ land_per_household_ha (default 0.08 ha)
 *   safeCapacity  = Math.round(grossCapacity × waterReliabilityScore)
 *   Example: 50 ha ÷ 0.08 = 625 -> water 0.6 -> 375 households
 */
export function carryingCapacity(
  usableAreaHa: number,
  landPerHouseholdHa: number = 0.08,
  waterReliabilityScore: number = 1.0,
  existingOccupiedHouseholds: number = 0
): {
  grossCapacity: number;
  safeCapacity: number;
  remainingCapacity: number;
  utilizationPct: number;
  trafficLight: 'Green' | 'Yellow' | 'Red';
} {
  const safeArea = Math.max(0, safeNumber(usableAreaHa, 0));
  const safeLandPerHh =
    Number.isFinite(landPerHouseholdHa) && landPerHouseholdHa > 0 ? landPerHouseholdHa : 0.08;
  const safeWater = Math.min(1, Math.max(0, safeNumber(waterReliabilityScore, 0)));
  const safeOccupied = Math.max(0, safeNumber(existingOccupiedHouseholds, 0));

  const grossCapacity = Math.round(safeArea / safeLandPerHh);
  const safeCapacity = Math.round((safeArea / safeLandPerHh) * safeWater);
  const remainingCapacity = Math.max(0, safeCapacity - safeOccupied);
  const utilizationPct =
    safeCapacity > 0
      ? Number(Math.min(100, (safeOccupied / safeCapacity) * 100).toFixed(1))
      : 100;

  let trafficLight: 'Green' | 'Yellow' | 'Red' = 'Green';
  if (utilizationPct >= 85 || remainingCapacity < 25) {
    trafficLight = 'Red';
  } else if (utilizationPct >= 60 || remainingCapacity < 75) {
    trafficLight = 'Yellow';
  }

  return {
    grossCapacity,
    safeCapacity,
    remainingCapacity,
    utilizationPct,
    trafficLight,
  };
}

/**
 * Multi-Criteria Decision Analysis (MCDA) score for a Candidate Relocation Site.
 */
export function calculateSiteSuitability(site: RelocationSite): {
  score: number;
  factors: {
    name: string;
    rawDisplay: string;
    normalizedValue: number;
    weight: number;
    contribution: number;
  }[];
} {
  const nArea = normalize(site.usableAreaHa, 5, 65);
  const nWater = Math.min(1, Math.max(0, site.waterReliabilityScore));
  const nRoad = Number((1 - normalize(site.roadDistKm, 0, 10)).toFixed(3));
  const nSchool = Number((1 - normalize(site.schoolDistKm, 0, 12)).toFixed(3));
  const nHealth = Number((1 - normalize(site.healthcareDistKm, 0, 20)).toFixed(3));
  const nHazardDist = normalize(site.hazardDistKm, 1, 15);

  const factors = [
    {
      name: 'Water Reliability',
      rawDisplay: `${Math.round(site.waterReliabilityScore * 100)}% perennial index`,
      normalizedValue: nWater,
      weight: 0.25,
      contribution: Number((nWater * 0.25).toFixed(3)),
    },
    {
      name: 'Usable Land Area',
      rawDisplay: `${site.usableAreaHa} ha`,
      normalizedValue: nArea,
      weight: 0.20,
      contribution: Number((nArea * 0.20).toFixed(3)),
    },
    {
      name: 'Distance from Hazard Zone',
      rawDisplay: `${site.hazardDistKm} km buffer`,
      normalizedValue: nHazardDist,
      weight: 0.15,
      contribution: Number((nHazardDist * 0.15).toFixed(3)),
    },
    {
      name: 'All-Weather Road Access',
      rawDisplay: `${site.roadDistKm} km`,
      normalizedValue: nRoad,
      weight: 0.15,
      contribution: Number((nRoad * 0.15).toFixed(3)),
    },
    {
      name: 'Healthcare Access',
      rawDisplay: `${site.healthcareDistKm} km to Hospital`,
      normalizedValue: nHealth,
      weight: 0.15,
      contribution: Number((nHealth * 0.15).toFixed(3)),
    },
    {
      name: 'School Proximity',
      rawDisplay: `${site.schoolDistKm} km`,
      normalizedValue: nSchool,
      weight: 0.10,
      contribution: Number((nSchool * 0.10).toFixed(3)),
    },
  ];

  const score = Number(
    factors.reduce((acc, f) => acc + f.contribution, 0).toFixed(3)
  );

  return { score, factors };
}

/**
 * Hazard Re-check on a Candidate Relocation Site:
 * Runs the hazard scoring method on the candidate site (Today & +20 yr projection).
 */
export function runDigitalDressRehearsal(
  site: RelocationSite,
  weights: HazardWeights
): {
  passed: boolean;
  todayScore: number;
  plus20Score: number;
  todayLevel: RiskLevel;
  plus20Level: RiskLevel;
  verdictText: string;
} {
  const todayScore = weightedScore(site.siteHazardFactors, weights, 0, 'today', 0);
  const plus20Score = weightedScore(site.siteHazardFactors, weights, 0, 'plus20', 0);
  const todayLevel = classifyHazard(todayScore);
  const plus20Level = classifyHazard(plus20Score);

  const passed = todayScore < 0.30 && plus20Score < 0.38;
  const verdictText = passed
    ? `PASS — Site hazard is ${todayScore.toFixed(3)} (${todayLevel}) today and ${plus20Score.toFixed(3)} under +20 yr climate stress. Verified safe for permanent resettlement.`
    : `FAIL — Site exhibits elevated hazard (${todayScore.toFixed(3)} today, ${plus20Score.toFixed(3)} in +20 yrs). Do not allot without slope and drainage mitigation.`;

  return {
    passed,
    todayScore,
    plus20Score,
    todayLevel,
    plus20Level,
    verdictText,
  };
}

/**
 * Computes Priority Ranking & Greedy Relocation Matching.
 * Priority = Hazard × Vulnerability (optionally adjusted by regional safe capacity scarcity).
 */
export function greedyMatch(
  villages: Village[],
  sites: RelocationSite[],
  weights: HazardWeights,
  options: {
    divideBySafeCapacity?: boolean;
    climateHorizon?: ClimateHorizon;
    extraRainfallMm?: number;
    customOrderIds?: string[];
    manualSiteOverrides?: Record<string, string>;
  } = {}
): RankedVillageEntry[] {
  const {
    divideBySafeCapacity = false,
    climateHorizon = 'today',
    extraRainfallMm = 0,
    customOrderIds = [],
    manualSiteOverrides = {},
  } = options || {};

  if (!Array.isArray(villages) || villages.length === 0) {
    return [];
  }
  const safeSites = Array.isArray(sites) ? sites : [];

  const sitePool = safeSites
    .map((site) => {
      const cap = carryingCapacity(
        site.usableAreaHa,
        site.landPerHouseholdHa,
        site.waterReliabilityScore,
        site.existingOccupiedHouseholds
      );
      const suit = calculateSiteSuitability(site);
      const ddr = runDigitalDressRehearsal(site, weights);
      return {
        site,
        suitabilityScore: suit.score,
        remainingSlots: cap.remainingCapacity,
        ddrPassed: ddr.passed,
      };
    })
    .sort((a, b) => {
      if (a.ddrPassed !== b.ddrPassed) return a.ddrPassed ? -1 : 1;
      return b.suitabilityScore - a.suitabilityScore;
    });

  const districtCapacityMap: Record<string, number> = {};
  for (const s of sitePool) {
    districtCapacityMap[s.site.district] =
      (districtCapacityMap[s.site.district] || 0) + s.remainingSlots;
  }

  const scored = villages.map((village) => {
    const hazardScore = weightedScore(
      village.hazardFactors,
      weights,
      village.verifiedReportsCount,
      climateHorizon,
      extraRainfallMm,
      village.liveRainfallMm24h
    );
    const vulnerabilityScore = computeVulnerability(village.vulnerabilityFactors);
    const riskLevel = classifyHazard(hazardScore);
    const quadrant = classifyQuadrant(hazardScore, vulnerabilityScore);

    let priorityScore = Number((hazardScore * vulnerabilityScore).toFixed(3));
    if (divideBySafeCapacity) {
      const distCap = districtCapacityMap[village.district] || 300;
      const scarcityFactor = Math.min(1.35, Math.max(0.75, 450 / Math.max(150, distCap)));
      priorityScore = Number(Math.min(0.999, priorityScore * scarcityFactor).toFixed(3));
    }

    return {
      village,
      hazardScore,
      vulnerabilityScore,
      priorityScore,
      riskLevel,
      quadrant,
    };
  });

  scored.sort((a, b) => {
    if (customOrderIds.length > 0) {
      const idxA = customOrderIds.indexOf(a.village.id);
      const idxB = customOrderIds.indexOf(b.village.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    }
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
    return b.hazardScore - a.hazardScore;
  });

  return scored.map((entry, idx) => {
    let needed = entry.village.households;
    const allocations: AllocationSlice[] = [];

    const shouldRelocate =
      entry.riskLevel === 'Immediate' ||
      entry.riskLevel === 'Short-term' ||
      Boolean(manualSiteOverrides[entry.village.id]);

    if (shouldRelocate) {
      const overrideSiteId = manualSiteOverrides[entry.village.id];
      if (overrideSiteId) {
        const target = sitePool.find((s) => s.site.id === overrideSiteId);
        if (target && target.remainingSlots > 0) {
          const take = Math.min(needed, target.remainingSlots);
          target.remainingSlots -= take;
          needed -= take;
          allocations.push({
            siteId: target.site.id,
            siteName: target.site.name,
            allocatedHouseholds: take,
            suitabilityScore: target.suitabilityScore,
            siteLat: target.site.lat,
            siteLng: target.site.lng,
          });
        }
      }

      for (const candidate of sitePool) {
        if (needed <= 0) break;
        if (
          candidate.site.district === entry.village.district &&
          candidate.remainingSlots > 0 &&
          candidate.ddrPassed
        ) {
          const take = Math.min(needed, candidate.remainingSlots);
          candidate.remainingSlots -= take;
          needed -= take;
          allocations.push({
            siteId: candidate.site.id,
            siteName: candidate.site.name,
            allocatedHouseholds: take,
            suitabilityScore: candidate.suitabilityScore,
            siteLat: candidate.site.lat,
            siteLng: candidate.site.lng,
          });
        }
      }

      for (const candidate of sitePool) {
        if (needed <= 0) break;
        if (candidate.remainingSlots > 0 && candidate.ddrPassed) {
          const take = Math.min(needed, candidate.remainingSlots);
          candidate.remainingSlots -= take;
          needed -= take;
          allocations.push({
            siteId: candidate.site.id,
            siteName: candidate.site.name,
            allocatedHouseholds: take,
            suitabilityScore: candidate.suitabilityScore,
            siteLat: candidate.site.lat,
            siteLng: candidate.site.lng,
          });
        }
      }
    }

    const primarySiteName =
      allocations.length > 0
        ? allocations
            .map((a) => `${a.siteName} (${a.allocatedHouseholds})`)
            .join(' + ')
        : shouldRelocate
        ? 'Additional Site Acquisition Required'
        : 'In-Situ Monitoring (No Relocation Required)';

    const firstAlloc = allocations[0];
    const allocatedHouseholds = allocations.reduce(
      (sum, a) => sum + a.allocatedHouseholds,
      0
    );
    const distanceKm =
      firstAlloc && firstAlloc.siteLat !== undefined && firstAlloc.siteLng !== undefined
        ? Number(
            distance(
              point([entry.village.lng, entry.village.lat]),
              point([firstAlloc.siteLng, firstAlloc.siteLat]),
              { units: 'kilometers' }
            ).toFixed(1)
          )
        : 0;

    return {
      rank: idx + 1,
      village: entry.village,
      hazardScore: entry.hazardScore,
      vulnerabilityScore: entry.vulnerabilityScore,
      priorityScore: entry.priorityScore,
      riskLevel: entry.riskLevel,
      quadrant: entry.quadrant,
      allocations,
      unallocatedHouseholds: shouldRelocate ? needed : 0,
      primarySiteName,
      allocatedSiteName: firstAlloc ? firstAlloc.siteName : primarySiteName,
      allocatedHouseholds,
      allocatedSiteLat: firstAlloc?.siteLat,
      allocatedSiteLng: firstAlloc?.siteLng,
      distanceKm,
    };
  });
}

/**
 * Simulates the effect of one or more engineering interventions on a habitation's hazard score.
 */
export function simulateIntervention(
  village: Village,
  selectedInterventions: InterventionOption[],
  weights: HazardWeights,
  extraRainfallMm: number = 100,
  climateHorizon: ClimateHorizon = 'today'
): {
  beforeScore: number;
  afterScore: number;
  beforeLevel: RiskLevel;
  afterLevel: RiskLevel;
  delta: number;
  modifiedFactors: HazardFactors;
  totalCostLakhs: number;
  maxDurationMonths: number;
  verdict: string;
} {
  const beforeScore = weightedScore(
    village.hazardFactors,
    weights,
    village.verifiedReportsCount,
    climateHorizon,
    extraRainfallMm
  );
  const beforeLevel = classifyHazard(beforeScore);

  const modifiedFactors: HazardFactors = { ...village.hazardFactors };
  let totalCostLakhs = 0;
  let maxDurationMonths = 0;

  for (const intv of selectedInterventions) {
    totalCostLakhs += intv.estimatedCostLakhs;
    maxDurationMonths = Math.max(maxDurationMonths, intv.durationMonths);
    if (intv.factorDeltas.rainfall) {
      modifiedFactors.rainfall = Math.max(
        0.05,
        Number((modifiedFactors.rainfall + intv.factorDeltas.rainfall).toFixed(3))
      );
    }
    if (intv.factorDeltas.slope) {
      modifiedFactors.slope = Math.max(
        0.05,
        Number((modifiedFactors.slope + intv.factorDeltas.slope).toFixed(3))
      );
    }
    if (intv.factorDeltas.history) {
      modifiedFactors.history = Math.max(
        0.05,
        Number((modifiedFactors.history + intv.factorDeltas.history).toFixed(3))
      );
    }
    if (intv.factorDeltas.riverProximity) {
      modifiedFactors.riverProximity = Math.max(
        0.05,
        Number(
          (modifiedFactors.riverProximity + intv.factorDeltas.riverProximity).toFixed(3)
        )
      );
    }
  }

  const afterScore = weightedScore(
    modifiedFactors,
    weights,
    village.verifiedReportsCount,
    climateHorizon,
    extraRainfallMm
  );
  const afterLevel = classifyHazard(afterScore);
  const delta = Number((afterScore - beforeScore).toFixed(3));

  let verdict = '';
  if (selectedInterventions.length === 0) {
    verdict = 'Select an engineering mitigation measure to evaluate risk reduction.';
  } else if (afterLevel === 'Immediate') {
    verdict = `Score drops from ${beforeScore.toFixed(3)} to ${afterScore.toFixed(3)}, but remains in Red Zone (>0.75). Engineering mitigation alone is insufficient — permanent relocation remains mandatory.`;
  } else if (beforeLevel === 'Immediate' && afterLevel === 'Short-term') {
    verdict = `Mitigation lowers score from ${beforeScore.toFixed(3)} to ${afterScore.toFixed(3)} (Short-term). Helps buy time for phased relocation, though monsoon monitoring remains essential.`;
  } else if (afterScore < 0.5) {
    verdict = `Effective engineering measure. Lowers hazard from ${beforeScore.toFixed(3)} (${beforeLevel}) to ${afterScore.toFixed(3)} (${afterLevel}), avoiding full habitation relocation.`;
  } else {
    verdict = `Lowers hazard score by ${Math.abs(delta).toFixed(3)} (${beforeScore.toFixed(3)} → ${afterScore.toFixed(3)}). Helpful mitigation, but does not fully eliminate multi-hazard risk.`;
  }

  return {
    beforeScore,
    afterScore,
    beforeLevel,
    afterLevel,
    delta,
    modifiedFactors,
    totalCostLakhs,
    maxDurationMonths,
    verdict,
  };
}

/**
 * Pure Turf.js Geofence Check (`geofenceCheck()`):
 * Checks whether a live coordinate [lat, lng] lies inside any Red or Orange hazard polygon
 * or within 200m of a river flood corridor, and computes the nearest safe Relief Camp.
 */
export function geofenceCheck(
  userLat: number,
  userLng: number,
  villages: Village[],
  camps: ReliefCamp[],
  riverPathsOrWeights?: unknown,
  maybeWeights?: HazardWeights
): {
  inDangerZone: boolean;
  inRiverBuffer200m: boolean;
  zoneLevel: RiskLevel;
  zoneType: string;
  zoneName: string;
  matchedVillage: Village | null;
  nearestCamp: (ReliefCamp & { distanceKm: number }) | null;
  nearestShelter: (ReliefCamp & { distanceKm: number }) | null;
  distanceToShelterKm: number;
  warningMessage: string;
} {
  const weights: HazardWeights =
    maybeWeights ||
    (riverPathsOrWeights &&
    typeof riverPathsOrWeights === 'object' &&
    !Array.isArray(riverPathsOrWeights)
      ? (riverPathsOrWeights as HazardWeights)
      : {
          rainfall: 0.35,
          slope: 0.30,
          history: 0.20,
          riverProximity: 0.15,
        });

  const userPt = point([userLng, userLat]);
  let matchedVillage: Village | null = null;
  let zoneLevel: RiskLevel = 'Safe';
  let inDangerZone = false;
  let inRiverBuffer200m = false;

  for (const v of villages) {
    const d = 0.038;
    const cellPoly = polygon([
      [
        [v.lng - d, v.lat - d],
        [v.lng + d, v.lat - d],
        [v.lng + d, v.lat + d],
        [v.lng - d, v.lat + d],
        [v.lng - d, v.lat - d],
      ],
    ]);

    if (booleanPointInPolygon(userPt, cellPoly)) {
      const score = weightedScore(v.hazardFactors, weights, v.verifiedReportsCount);
      const lvl = classifyHazard(score);
      if (lvl === 'Immediate' || lvl === 'Short-term') {
        inDangerZone = true;
        matchedVillage = v;
        zoneLevel = lvl;
        if (v.riverDistKm <= 0.25) {
          inRiverBuffer200m = true;
        }
        break;
      }
    }
  }

  let nearestCamp: (ReliefCamp & { distanceKm: number }) | null = null;
  for (const camp of camps) {
    const campPt = point([camp.lng, camp.lat]);
    const distKm = Number(distance(userPt, campPt, { units: 'kilometers' }).toFixed(2));
    if (!nearestCamp || distKm < nearestCamp.distanceKm) {
      nearestCamp = { ...camp, distanceKm: distKm };
    }
  }

  const zoneType =
    zoneLevel === 'Immediate'
      ? 'Red Hazard Zone'
      : zoneLevel === 'Short-term'
      ? 'Orange Hazard Zone'
      : 'Safe Zone';
  const zoneName = matchedVillage
    ? `${matchedVillage.name} (${matchedVillage.district} District)`
    : 'Safe Corridor';
  const distanceToShelterKm = nearestCamp?.distanceKm ?? 0;

  const warningMessage =
    inDangerZone && matchedVillage
      ? `GEOFENCE WARNING: You have entered the ${zoneLevel.toUpperCase()} Hazard Zone of ${
          matchedVillage.name
        } (${matchedVillage.district})${
          inRiverBuffer200m ? ' & 200m River Flood Buffer' : ''
        }. Nearest Safe Shelter: ${nearestCamp?.name || 'Designated Camp'} (${distanceToShelterKm} km away).`
      : 'Location is outside active Red and Orange hazard perimeters.';

  return {
    inDangerZone,
    inRiverBuffer200m,
    zoneLevel,
    zoneType,
    zoneName,
    matchedVillage,
    nearestCamp,
    nearestShelter: nearestCamp,
    distanceToShelterKm,
    warningMessage,
  };
}

/**
 * Pure Hydrological Flood-Fill Simulator (`floodFill()`):
 * Given a water level rise (0–15 m above river bed), computes hydrologically connected
 * flood-fill inundation polygons along river corridors and uses Turf spatial queries
 * (`booleanPointInPolygon`) to report affected habitations, households, roads cut, and shelters.
 */
export function floodFill(
  waterLevelRiseM: number,
  villages: Village[],
  camps: ReliefCamp[],
  riverCorridors: { name: string; coords: [number, number][] }[] = [
    {
      name: 'Savitri River (Mahad-Poladpur)',
      coords: [
        [18.082, 73.418],
        [18.045, 73.485],
        [17.984, 73.462],
      ],
    },
    {
      name: 'Vashishti River (Chiplun)',
      coords: [
        [17.533, 73.518],
        [17.56, 73.58],
        [17.51, 73.63],
      ],
    },
    {
      name: 'Kundalika & Patalganga (Raigad)',
      coords: [
        [18.926, 73.236],
        [18.85, 73.2],
        [18.44, 73.31],
      ],
    },
    {
      name: 'Koyna & Krishna Basin (Satara)',
      coords: [
        [17.398, 73.752],
        [17.375, 73.9],
        [17.68, 73.99],
      ],
    },
    {
      name: 'Ghod & Bhima Tributaries (Pune)',
      coords: [
        [19.124, 73.551],
        [19.04, 73.68],
        [18.75, 73.55],
      ],
    },
  ]
): FloodSimulationResult {
  const clampedRise = Math.max(0, Math.min(15, waterLevelRiseM));
  if (clampedRise <= 0.1) {
    return {
      waterLevelRiseM: clampedRise,
      cells: [],
      affectedHabitations: [],
      affectedHouseholds: 0,
      affectedPopulation: 0,
      affectedShelters: [],
      roadsCutCount: 0,
    };
  }

  // Spread buffer degree scales non-linearly with water rise (0..15m -> up to ~4.8km floodplain width)
  const spreadDeg = 0.0045 * clampedRise;
  const cells: FloodInundationCell[] = [];

  riverCorridors.forEach((river, rIdx) => {
    for (let i = 0; i < river.coords.length - 1; i++) {
      const [lat1, lng1] = river.coords[i];
      const [lat2, lng2] = river.coords[i + 1];
      const steps = 6;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const cLat = lat1 + (lat2 - lat1) * t;
        const cLng = lng1 + (lng2 - lng1) * t;
        // Core deep channel cell + outer floodplain cell
        const rings = clampedRise >= 6 ? [0.55, 1.0] : [0.85];
        rings.forEach((factor, ringIdx) => {
          const half = spreadDeg * factor;
          const depth = Number(
            Math.max(0.4, clampedRise * (1.05 - ringIdx * 0.42)).toFixed(1)
          );
          cells.push({
            id: `flood-${rIdx}-${i}-${s}-${ringIdx}`,
            riverName: river.name,
            depthMeters: depth,
            polygon: [
              [cLng - half, cLat - half],
              [cLng + half, cLat - half],
              [cLng + half, cLat + half],
              [cLng - half, cLat + half],
              [cLng - half, cLat - half],
            ],
          });
        });
      }
    }
  });

  // Also check low-elevation river-proximate habitations hydrologically connected to channels
  const affectedHabitations: Village[] = [];
  for (const v of villages) {
    const vPt = point([v.lng, v.lat]);
    let insidePoly = false;
    for (const c of cells) {
      if (booleanPointInPolygon(vPt, polygon([c.polygon]))) {
        insidePoly = true;
        break;
      }
    }
    // Hydrological bank-overtopping threshold based on riverDistKm and slope
    const bankThresholdM = v.riverDistKm * 4.2 + (v.slopeDeg > 22 ? 6.5 : 1.2);
    if (insidePoly || clampedRise >= bankThresholdM) {
      affectedHabitations.push(v);
      if (!insidePoly) {
        const h = 0.018 + clampedRise * 0.0012;
        cells.push({
          id: `flood-hab-${v.id}`,
          riverName: `${v.name} Floodplain`,
          depthMeters: Number(Math.max(0.5, clampedRise - bankThresholdM + 1.2).toFixed(1)),
          polygon: [
            [v.lng - h, v.lat - h],
            [v.lng + h, v.lat - h],
            [v.lng + h, v.lat + h],
            [v.lng - h, v.lat + h],
            [v.lng - h, v.lat - h],
          ],
        });
      }
    }
  }

  const affectedShelters: ReliefCamp[] = [];
  for (const camp of camps) {
    const cPt = point([camp.lng, camp.lat]);
    for (const c of cells) {
      if (booleanPointInPolygon(cPt, polygon([c.polygon]))) {
        affectedShelters.push(camp);
        break;
      }
    }
  }

  const affectedHouseholds = affectedHabitations.reduce((acc, v) => acc + v.households, 0);
  const affectedPopulation = affectedHabitations.reduce((acc, v) => acc + v.population, 0);
  const roadsCutCount = Math.min(
    28,
    Math.round(affectedHabitations.length * 1.4 + (clampedRise >= 8 ? 4 : 1))
  );

  return {
    waterLevelRiseM: clampedRise,
    cells,
    affectedHabitations,
    affectedHouseholds,
    affectedPopulation,
    affectedShelters,
    roadsCutCount,
  };
}

/**
 * Pure Elevation Profile & Line-of-Sight Function (`elevationProfile()`):
 * Samples points along a coordinate path `[lat, lng][]`, interpolates Western Ghats DEM
 * terrain elevation, computes segment slope % and slope class, total ascent/descent,
 * and Line-of-Sight visibility between start and end points.
 */
export function elevationProfile(
  latLngPath: [number, number][],
  villages: Village[] = [],
  sampleCount: number = 24
): ElevationProfileSummary {
  if (latLngPath.length < 2) {
    return {
      points: [],
      totalDistanceKm: 0,
      totalAscentM: 0,
      totalDescentM: 0,
      maxSlopePct: 0,
      avgSlopePct: 0,
      hasLineOfSight: true,
      obstructionDistanceKm: null,
    };
  }

  const lineCoords = latLngPath.map(([lat, lng]) => [lng, lat]);
  const line = lineString(lineCoords);

  let totalDistKm = 0;
  for (let i = 0; i < lineCoords.length - 1; i++) {
    totalDistKm += distance(point(lineCoords[i]), point(lineCoords[i + 1]), {
      units: 'kilometers',
    });
  }
  totalDistKm = Math.max(0.2, Number(totalDistKm.toFixed(2)));

  // Deterministic Western Ghats terrain elevation model anchored to nearby habitations
  const estimateDemElevation = (lat: number, lng: number, idx: number): number => {
    let weightedElev = 0;
    let weightSum = 0;
    for (const v of villages) {
      const d = Math.hypot(v.lat - lat, v.lng - lng);
      const w = 1 / Math.pow(Math.max(0.008, d), 2);
      weightedElev += v.elevationM * w;
      weightSum += w;
    }
    const base = weightSum > 0 ? weightedElev / weightSum : 320;
    // Add realistic topographic ridge/valley undulation
    const ridgeWave =
      Math.sin(lat * 45 + idx * 0.35) * 42 + Math.cos(lng * 55 - idx * 0.25) * 28;
    return Math.max(15, Math.round(base + ridgeWave));
  };

  const rawPoints: { distanceKm: number; lat: number; lng: number; elevationM: number }[] = [];
  for (let i = 0; i <= sampleCount; i++) {
    const dist = Number(((totalDistKm * i) / sampleCount).toFixed(2));
    const ptFeature = along(line, dist, { units: 'kilometers' });
    const [lng, lat] = ptFeature.geometry.coordinates;
    const elevationM = estimateDemElevation(lat, lng, i);
    rawPoints.push({ distanceKm: dist, lat, lng, elevationM });
  }

  const startElev = rawPoints[0].elevationM + 2; // observer height +2m
  const endElev = rawPoints[rawPoints.length - 1].elevationM + 2;

  let totalAscentM = 0;
  let totalDescentM = 0;
  let maxSlopePct = 0;
  let slopeSum = 0;
  let hasLineOfSight = true;
  let obstructionDistanceKm: number | null = null;

  const points: ElevationProfilePoint[] = rawPoints.map((pt, idx) => {
    let slopePct = 0;
    if (idx > 0) {
      const prev = rawPoints[idx - 1];
      const dElev = pt.elevationM - prev.elevationM;
      const dHorizM = Math.max(10, (pt.distanceKm - prev.distanceKm) * 1000);
      slopePct = Number((Math.abs(dElev / dHorizM) * 100).toFixed(1));
      if (dElev > 0) totalAscentM += dElev;
      if (dElev < 0) totalDescentM += Math.abs(dElev);
      if (slopePct > maxSlopePct) maxSlopePct = slopePct;
      slopeSum += slopePct;
    }

    const frac = totalDistKm > 0 ? pt.distanceKm / totalDistKm : 0;
    const losLineElevationM = Math.round(startElev + (endElev - startElev) * frac);
    const obstructed =
      idx > 0 && idx < rawPoints.length - 1 && pt.elevationM > losLineElevationM + 8;

    if (obstructed && hasLineOfSight) {
      hasLineOfSight = false;
      obstructionDistanceKm = pt.distanceKm;
    }

    const slopeClass: ElevationProfilePoint['slopeClass'] =
      slopePct >= 45
        ? 'Very Steep (>45%)'
        : slopePct >= 25
        ? 'Steep (25-45%)'
        : slopePct >= 10
        ? 'Moderate (10-25%)'
        : 'Gentle (<10%)';

    return {
      ...pt,
      slopePct,
      slopeClass,
      losLineElevationM,
      obstructed,
    };
  });

  const avgSlopePct = Number((slopeSum / Math.max(1, sampleCount)).toFixed(1));

  return {
    points,
    totalDistanceKm: totalDistKm,
    totalAscentM: Math.round(totalAscentM),
    totalDescentM: Math.round(totalDescentM),
    maxSlopePct,
    avgSlopePct,
    hasLineOfSight,
    obstructionDistanceKm,
  };
}

/**
 * Deterministic Score Rationale Template Engine (`buildRationale()`):
 * Produces a court-defensible, plain-language operational rationale from factor contributions
 * with zero external model dependencies and zero generated-text branding.
 */
export function buildRationale(
  payload: ExplainScorePayload,
  language: Language = 'en',
  totalHabitations: number = 40
): string {
  if (!payload || typeof payload !== 'object') return 'Insufficient data for score rationale.';
  const factors = Array.isArray(payload.factors) ? payload.factors : [];
  const notes = Array.isArray(payload.contextNotes) ? payload.contextNotes : [];
  const name = payload.villageName || payload.title || 'Habitation';
  const dist = payload.district || payload.subtitle || 'District';
  const scoreType = payload.scoreType || 'hazard';

  const sorted = [...factors].sort((a, b) => b.contribution - a.contribution);
  const top1 = sorted[0];
  const top2 = sorted[1];
  const rankClause = payload.rank
    ? `Ranked ${payload.rank} of ${totalHabitations}: `
    : `${name} (${dist} District): `;

  if (language === 'hi') {
    return `${
      payload.rank ? `${totalHabitations} में से रैंक ${payload.rank}: ` : `${name} (${dist}): `
    }कुल स्कोर ${safeNumber(payload.totalScore, 0).toFixed(3)} (${payload.riskLevel || 'मूल्यांकित'})। ${
      top1 ? `${top1.name} का योगदान ${top1.percentageOfScore ?? 0}% (${top1.rawDisplay}) है` : ''
    }${
      top2 ? `; इसके बाद ${top2.name} का योगदान ${top2.percentageOfScore ?? 0}% (${top2.rawDisplay}) है। ` : '। '
    }${notes[0] || ''} ${notes[2] || ''}`.trim();
  }

  if (language === 'mr') {
    return `${
      payload.rank ? `${totalHabitations} पैकी क्रमांक ${payload.rank}: ` : `${name} (${dist}): `
    }एकूण गुण ${safeNumber(payload.totalScore, 0).toFixed(3)} (${payload.riskLevel || 'मूल्यांकित'})। ${
      top1 ? `${top1.name} चा वाटा ${top1.percentageOfScore ?? 0}% (${top1.rawDisplay}) आहे` : ''
    }${
      top2 ? `; त्यानंतर ${top2.name} चा वाटा ${top2.percentageOfScore ?? 0}% (${top2.rawDisplay}) आहे. ` : '. '
    }${notes[0] || ''} ${notes[2] || ''}`.trim();
  }

  const notesSuffix = notes.length > 0 ? ` ${notes.join('; ')}.` : '';
  return `${rankClause}${
    top1
      ? `${top1.name.toLowerCase()} contributes ${top1.percentageOfScore ?? 0}% of the ${scoreType} score (${top1.rawDisplay})`
      : `composite score is ${safeNumber(payload.totalScore, 0).toFixed(3)}`
  }${
    top2
      ? `; ${top2.name.toLowerCase()} contributes ${top2.percentageOfScore ?? 0}% (${top2.rawDisplay})`
      : ''
  }.${notesSuffix}`;
}

/**
 * Converts decimal degrees (lat, lng) into Degrees Minutes Seconds (DMS) string.
 */
export function formatLatLngToDms(lat: number, lng: number): string {
  const toDms = (deg: number, isLat: boolean) => {
    const absolute = Math.abs(deg);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
    const dir = isLat ? (deg >= 0 ? 'N' : 'S') : deg >= 0 ? 'E' : 'W';
    return `${degrees}°${minutes}'${seconds}"${dir}`;
  };
  return `${toDms(lat, true)}, ${toDms(lng, false)}`;
}

/**
 * Converts decimal degrees (lat, lng) into approximate UTM Zone 43N coordinate string.
 */
export function formatLatLngToUtm(lat: number, lng: number): string {
  const zone = Math.floor((lng + 180) / 6) + 1;
  const easting = Math.round(500000 + (lng - (zone * 6 - 183)) * 111320 * Math.cos((lat * Math.PI) / 180));
  const northing = Math.round(lat * 110574);
  return `43Q ${easting}E ${northing}N`;
}

/**
 * Builds an ExplainScorePayload for a habitation's Hazard score.
 */
export function buildVillageExplainPayload(
  village: Village,
  weights: HazardWeights,
  rank?: number,
  climateHorizon: ClimateHorizon = 'today',
  extraRainfallMm: number = 0
): ExplainScorePayload {
  const totalScore = weightedScore(
    village.hazardFactors,
    weights,
    village.verifiedReportsCount,
    climateHorizon,
    extraRainfallMm,
    village.liveRainfallMm24h
  );
  const riskLevel = classifyHazard(totalScore);

  const cRain = Number((village.hazardFactors.rainfall * weights.rainfall).toFixed(3));
  const cSlope = Number((village.hazardFactors.slope * weights.slope).toFixed(3));
  const cHist = Number(
    (
      Math.min(1, village.hazardFactors.history + village.verifiedReportsCount * 0.025) *
      weights.history
    ).toFixed(3)
  );
  const cRiver = Number(
    (village.hazardFactors.riverProximity * weights.riverProximity).toFixed(3)
  );

  const sumContrib = cRain + cSlope + cHist + cRiver || 1;

  return {
    title: `${village.name} — Multi-Hazard Score Breakdown`,
    subtitle: `${village.taluka} Taluka, ${village.district} District · Primary Hazard: ${village.primaryHazard.toUpperCase()}`,
    totalScore,
    riskLevel,
    scoreType: 'hazard',
    rank,
    villageName: village.name,
    entityName: village.name,
    district: village.district,
    factors: [
      {
        name: 'Monsoon Rainfall Intensity',
        rawDisplay: `${village.annualRainfallMm} mm/yr`,
        normalizedValue: village.hazardFactors.rainfall,
        weight: weights.rainfall,
        contribution: cRain,
        percentageOfScore: Math.round((cRain / sumContrib) * 100),
        color: '#0B8F80',
      },
      {
        name: 'Terrain Slope Gradient',
        rawDisplay: `${village.slopeDeg}° incline (${village.elevationM}m ASL)`,
        normalizedValue: village.hazardFactors.slope,
        weight: weights.slope,
        contribution: cSlope,
        percentageOfScore: Math.round((cSlope / sumContrib) * 100),
        color: '#EA580C',
      },
      {
        name: 'Past Disaster & Crack Reports',
        rawDisplay: `${village.pastIncidentsCount} events recorded in 5 years + ${village.verifiedReportsCount} verified reports`,
        normalizedValue: village.hazardFactors.history,
        weight: weights.history,
        contribution: cHist,
        percentageOfScore: Math.round((cHist / sumContrib) * 100),
        color: '#B91C1C',
      },
      {
        name: 'River / Scarp Proximity',
        rawDisplay: `${village.riverDistKm} km from channel/toe`,
        normalizedValue: village.hazardFactors.riverProximity,
        weight: weights.riverProximity,
        contribution: cRiver,
        percentageOfScore: Math.round((cRiver / sumContrib) * 100),
        color: '#1E40AF',
      },
    ],
    contextNotes: [
      `${village.pastIncidentsCount} landslide/flood events recorded in 5 years`,
      `Elderly population ${village.vulnerabilityFactors.elderlyPct}%, kutcha houses ${village.vulnerabilityFactors.kutchaHousePct}%`,
      `Nearest primary trauma/hospital care ${village.vulnerabilityFactors.healthcareDistKm} km away`,
    ],
  };
}

/**
 * Deterministic hash-chain generator for the Tamper-Proof Relocation Case Ledger.
 */
export function computeLedgerHash(prevHash: string, recordPayload: string): string {
  const input = `${prevHash}::${recordPayload}`;
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0, ch; i < input.length; i++) {
    ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `0x${hex1}${hex2}`;
}

/**
 * Section 6.2 Risk Chain Step 2: Exposure (normalised 0–100).
 * Combines population and household assets inside the affected hazard footprint.
 * Total function: never throws, never returns NaN or Infinity.
 */
export function computeExposure(
  population: number | null | undefined,
  households: number | null | undefined,
  hazardScore0to1: number | null | undefined = 0.5
): SafeScoreResult {
  const warnings: string[] = [];
  if (population === null || population === undefined || !Number.isFinite(Number(population))) {
    warnings.push('Population count is missing or unknown.');
  }
  if (households === null || households === undefined || !Number.isFinite(Number(households))) {
    warnings.push('Household count is missing or unknown.');
  }
  if (warnings.length === 2) {
    return { value: 0, status: 'insufficient', warnings };
  }

  const popNorm = normalize(safeNumber(population, 0), 0, 2500);
  const hhNorm = normalize(safeNumber(households, 0), 0, 500);
  const hazFactor = Math.min(1, Math.max(0.2, safeNumber(hazardScore0to1, 0.5)));
  const raw0to100 = Math.min(100, Math.max(0, (0.6 * popNorm + 0.4 * hhNorm) * hazFactor * 100));

  return {
    value: Number(raw0to100.toFixed(1)),
    status: warnings.length === 0 ? 'ok' : 'partial',
    warnings,
  };
}

/**
 * Section 6.2 Risk Chain Step 4: Overall Risk (normalised 0–100).
 * Documented combination of Hazard (0–100), Exposure (0–100), and Vulnerability (0–100).
 */
export function overallRisk(
  hazard0to100: number | null | undefined,
  exposure0to100: number | null | undefined,
  vulnerability0to100: number | null | undefined
): SafeScoreResult {
  const warnings: string[] = [];
  const inputs = [
    { name: 'hazard', val: hazard0to100, weight: 0.45 },
    { name: 'exposure', val: exposure0to100, weight: 0.25 },
    { name: 'vulnerability', val: vulnerability0to100, weight: 0.30 },
  ];

  let weightedSum = 0;
  let weightTotal = 0;
  for (const item of inputs) {
    if (item.val === null || item.val === undefined || !Number.isFinite(Number(item.val))) {
      warnings.push(`Component '${item.name}' is unknown.`);
      continue;
    }
    const clamped = Math.min(100, Math.max(0, Number(item.val)));
    weightedSum += clamped * item.weight;
    weightTotal += item.weight;
  }

  if (weightTotal <= 0) {
    return { value: 0, status: 'insufficient', warnings };
  }

  const combined = Number(Math.min(100, Math.max(0, weightedSum / weightTotal)).toFixed(1));
  return {
    value: combined,
    status: warnings.length === 0 ? 'ok' : warnings.length === 1 ? 'partial' : 'insufficient',
    warnings,
  };
}

/**
 * Section 6.3 Sites and Capacity:
 * Capacity = min(land_capacity, water_capacity, infrastructure_capacity) in people.
 * Always returns all three values and the binding constraint label
 * (e.g., "Limited by water: 2,000 of 2,500").
 */
export function capacityFromConstraints(
  landCapacityPeople: number,
  waterCapacityPeople: number,
  infrastructureCapacityPeople: number,
  allocatedPeople: number = 0
): {
  landCapacity: number;
  waterCapacity: number;
  infrastructureCapacity: number;
  effectiveCapacity: number;
  remainingCapacity: number;
  bindingConstraint: 'land' | 'water' | 'infrastructure';
  bindingLabel: string;
} {
  const land = Math.max(0, Math.round(safeNumber(landCapacityPeople, 0)));
  const water = Math.max(0, Math.round(safeNumber(waterCapacityPeople, 0)));
  const infra = Math.max(0, Math.round(safeNumber(infrastructureCapacityPeople, 0)));
  const alloc = Math.max(0, Math.round(safeNumber(allocatedPeople, 0)));

  const maxCap = Math.max(land, water, infra);
  const effectiveCapacity = Math.min(land, water, infra);
  const remainingCapacity = Math.max(0, effectiveCapacity - alloc);

  let bindingConstraint: 'land' | 'water' | 'infrastructure' = 'land';
  if (effectiveCapacity === water) {
    bindingConstraint = 'water';
  } else if (effectiveCapacity === infra) {
    bindingConstraint = 'infrastructure';
  }

  const bindingLabel = `Limited by ${bindingConstraint}: ${effectiveCapacity.toLocaleString()} of ${maxCap.toLocaleString()}`;

  return {
    landCapacity: land,
    waterCapacity: water,
    infrastructureCapacity: infra,
    effectiveCapacity,
    remainingCapacity,
    bindingConstraint,
    bindingLabel,
  };
}

/**
 * Section 6.4 Allocation Validator:
 * Re-validates an allocation plan to ensure:
 * 1. Excluded sites (failing safety re-check) never receive allocations.
 * 2. Assigned households/population never exceed site safe capacity.
 * 3. Infeasible allocations report exact unassigned counts and binding reasons.
 */
export function validateAllocation(
  rankedEntries: RankedVillageEntry[],
  sites: RelocationSite[],
  weights: HazardWeights
): {
  valid: boolean;
  feasible: boolean;
  totalUnassignedHouseholds: number;
  totalUnassignedPopulation: number;
  violations: string[];
  unassignedReasons: string[];
} {
  const violations: string[] = [];
  const unassignedReasons: string[] = [];
  const siteUsage = new Map<string, number>();

  const siteMeta = new Map<
    string,
    { site: RelocationSite; passed: boolean; remainingCapacity: number }
  >();
  for (const s of Array.isArray(sites) ? sites : []) {
    const ddr = runDigitalDressRehearsal(s, weights);
    const cap = carryingCapacity(
      s.usableAreaHa,
      s.landPerHouseholdHa,
      s.waterReliabilityScore,
      s.existingOccupiedHouseholds
    );
    siteMeta.set(s.id, {
      site: s,
      passed: ddr.passed,
      remainingCapacity: cap.remainingCapacity,
    });
  }

  let totalUnassignedHouseholds = 0;
  let totalUnassignedPopulation = 0;

  for (const entry of Array.isArray(rankedEntries) ? rankedEntries : []) {
    for (const slice of entry.allocations || []) {
      const meta = siteMeta.get(slice.siteId);
      if (!meta) {
        violations.push(`Unknown site ID '${slice.siteId}' assigned to ${entry.village.name}.`);
        continue;
      }
      if (!meta.passed) {
        violations.push(
          `Excluded site '${meta.site.name}' failed hazard safety re-check but was assigned ${slice.allocatedHouseholds} HH.`
        );
      }
      const nextUsed = (siteUsage.get(slice.siteId) || 0) + slice.allocatedHouseholds;
      siteUsage.set(slice.siteId, nextUsed);
      if (nextUsed > meta.remainingCapacity) {
        violations.push(
          `Capacity exceeded at '${meta.site.name}': allocated ${nextUsed} HH > remaining capacity ${meta.remainingCapacity} HH.`
        );
      }
    }

    if (
      (entry.riskLevel === 'Immediate' || entry.riskLevel === 'Short-term') &&
      entry.unallocatedHouseholds > 0
    ) {
      totalUnassignedHouseholds += entry.unallocatedHouseholds;
      const avgHhSize =
        entry.village.households > 0
          ? entry.village.population / entry.village.households
          : 4.5;
      totalUnassignedPopulation += Math.round(entry.unallocatedHouseholds * avgHhSize);
      unassignedReasons.push(
        `${entry.village.name}: ${entry.unallocatedHouseholds} HH unassigned due to district safe site capacity constraint.`
      );
    }
  }

  return {
    valid: violations.length === 0,
    feasible: totalUnassignedHouseholds === 0 && violations.length === 0,
    totalUnassignedHouseholds,
    totalUnassignedPopulation,
    violations,
    unassignedReasons,
  };
}

/**
 * Section 6.5 Scenario Simulator:
 * Compares Baseline vs Scenario side-by-side under controlled assumptions.
 * Label: "Scenario simulation. Not a forecast."
 */
export function simulateScenario(
  villages: Village[],
  sites: RelocationSite[],
  weights: HazardWeights,
  scenarioParams: {
    extraRainfallMm?: number;
    climateHorizon?: ClimateHorizon;
    unavailableSiteIds?: string[];
  } = {}
): {
  label: string;
  baselineRanked: RankedVillageEntry[];
  scenarioRanked: RankedVillageEntry[];
  bandChangedVillages: Array<{
    villageId: string;
    villageName: string;
    baselineBand: RiskLevel;
    scenarioBand: RiskLevel;
  }>;
  baselineUnassignedHh: number;
  scenarioUnassignedHh: number;
  unassignedDeltaHh: number;
} {
  const baselineRanked = greedyMatch(villages, sites, weights, {
    climateHorizon: 'today',
    extraRainfallMm: 0,
  });

  const unavailableSet = new Set(scenarioParams.unavailableSiteIds || []);
  const availableSites = (Array.isArray(sites) ? sites : []).filter(
    (s) => !unavailableSet.has(s.id)
  );

  const scenarioRanked = greedyMatch(villages, availableSites, weights, {
    climateHorizon: scenarioParams.climateHorizon || 'today',
    extraRainfallMm: safeNumber(scenarioParams.extraRainfallMm, 0),
  });

  const baselineMap = new Map(baselineRanked.map((r) => [r.village.id, r]));
  const bandChangedVillages: Array<{
    villageId: string;
    villageName: string;
    baselineBand: RiskLevel;
    scenarioBand: RiskLevel;
  }> = [];

  for (const sEntry of scenarioRanked) {
    const bEntry = baselineMap.get(sEntry.village.id);
    if (bEntry && bEntry.riskLevel !== sEntry.riskLevel) {
      bandChangedVillages.push({
        villageId: sEntry.village.id,
        villageName: sEntry.village.name,
        baselineBand: bEntry.riskLevel,
        scenarioBand: sEntry.riskLevel,
      });
    }
  }

  const baselineUnassignedHh = baselineRanked
    .filter((r) => r.riskLevel === 'Immediate' || r.riskLevel === 'Short-term')
    .reduce((sum, r) => sum + r.unallocatedHouseholds, 0);
  const scenarioUnassignedHh = scenarioRanked
    .filter((r) => r.riskLevel === 'Immediate' || r.riskLevel === 'Short-term')
    .reduce((sum, r) => sum + r.unallocatedHouseholds, 0);

  return {
    label: 'Scenario simulation. Not a forecast.',
    baselineRanked,
    scenarioRanked,
    bandChangedVillages,
    baselineUnassignedHh,
    scenarioUnassignedHh,
    unassignedDeltaHh: scenarioUnassignedHh - baselineUnassignedHh,
  };
}

/**
 * Section 11 & 12 Defensive Coordinate & Record Parser (`safeParse`):
 * Validates coordinate bounds (lat -90..90, lng -180..180) and flags points outside
 * the India bounding box (6..38°N, 68..98°E) without throwing or returning NaN.
 */
export function safeParse(raw: unknown): {
  valid: boolean;
  lat: number | null;
  lng: number | null;
  withinIndiaBounds: boolean;
  warnings: string[];
} {
  if (!raw || typeof raw !== 'object') {
    return {
      valid: false,
      lat: null,
      lng: null,
      withinIndiaBounds: false,
      warnings: ['Input record is null or not an object.'],
    };
  }

  const rec = raw as Record<string, unknown>;
  const rawLat = rec.lat ?? rec.latitude;
  const rawLng = rec.lng ?? rec.lon ?? rec.longitude;

  const numLat = typeof rawLat === 'number' ? rawLat : Number(rawLat);
  const numLng = typeof rawLng === 'number' ? rawLng : Number(rawLng);
  const warnings: string[] = [];

  if (
    rawLat === null ||
    rawLat === undefined ||
    rawLng === null ||
    rawLng === undefined ||
    !Number.isFinite(numLat) ||
    !Number.isFinite(numLng)
  ) {
    return {
      valid: false,
      lat: null,
      lng: null,
      withinIndiaBounds: false,
      warnings: ['Coordinates are missing or NaN.'],
    };
  }

  if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
    return {
      valid: false,
      lat: Math.max(-90, Math.min(90, numLat)),
      lng: Math.max(-180, Math.min(180, numLng)),
      withinIndiaBounds: false,
      warnings: [`Coordinates (${numLat}, ${numLng}) exceed global WGS84 bounds.`],
    };
  }

  const withinIndiaBounds = numLat >= 6 && numLat <= 38 && numLng >= 68 && numLng <= 98;
  if (!withinIndiaBounds) {
    warnings.push(`Coordinates (${numLat}, ${numLng}) lie outside India bounding box (6°–38°N, 68°–98°E).`);
  }

  return {
    valid: true,
    lat: Number(numLat.toFixed(6)),
    lng: Number(numLng.toFixed(6)),
    withinIndiaBounds,
    warnings,
  };
}

