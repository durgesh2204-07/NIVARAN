import { describe, expect, it } from 'vitest';
import {
  buildRationale,
  capacityFromConstraints,
  carryingCapacity,
  classifyHazard,
  classifyRiskScore,
  computeExposure,
  computeVulnerability,
  elevationProfile,
  floodFill,
  geofenceCheck,
  getRiskColor,
  getRiskColorByScore,
  greedyMatch,
  normalize,
  overallRisk,
  safeComputeHazardScore,
  safeParse,
  simulateIntervention,
  simulateScenario,
  validateAllocation,
  weightedScore,
} from '../scoring';
import { INITIAL_RELIEF_CAMPS, INITIAL_RELOCATION_SITES, INITIAL_VILLAGES, INTERVENTION_OPTIONS } from '../../data/mockData';

describe('Deterministic Scoring & Spatial Engine (Section 7 & 9.4)', () => {
  describe('normalize()', () => {
    it('normalizes standard values into [0, 1]', () => {
      expect(normalize(50, 0, 100)).toBe(0.5);
      expect(normalize(25, 0, 100)).toBe(0.25);
    });

    it('clamps out-of-range values and handles inverted/equal min-max and NaN safely', () => {
      expect(normalize(-50, 0, 100)).toBe(0);
      expect(normalize(250, 0, 100)).toBe(1);
      expect(normalize(50, 100, 100)).toBe(0);
      expect(normalize(50, 200, 100)).toBe(0);
      expect(normalize(Number.NaN, 0, 100)).toBe(0);
      expect(normalize(Number.POSITIVE_INFINITY, 0, 100)).toBe(0);
    });
  });


  describe('classifyRiskScore() Standardized 0-100 Non-Overlapping Classification (Section 1 & 9)', () => {
    const testCases: [number, string, string, string][] = [
      [0.0, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [10.0, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [19.99, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [20.0, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [35.0, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [39.99, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [40.0, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [55.0, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [59.99, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [60.0, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [75.0, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [79.99, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [80.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [85.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [92.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [100.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
    ];

    testCases.forEach(([score, expectedCategory, expectedColor, expectedCode]) => {
      it(`classifies score ${score} -> ${expectedCategory} (${expectedColor})`, () => {
        const res = classifyRiskScore(score);
        expect(res.category).toBe(expectedCategory);
        expect(res.colorHex).toBe(expectedColor);
        expect(res.categoryCode).toBe(expectedCode);
        expect(getRiskColorByScore(score)).toBe(expectedColor);
      });
    });

    it('enforces boundary rules: 80 is RED, 79.99 is YELLOW, 60 is YELLOW, 59.99 is ORANGE', () => {
      expect(classifyRiskScore(80.0).categoryCode).toBe('RED');
      expect(classifyRiskScore(79.99).categoryCode).toBe('YELLOW');
      expect(classifyRiskScore(60.0).categoryCode).toBe('YELLOW');
      expect(classifyRiskScore(59.99).categoryCode).toBe('ORANGE');
      expect(classifyRiskScore(40.0).categoryCode).toBe('ORANGE');
      expect(classifyRiskScore(39.99).categoryCode).toBe('LIGHT_GREEN');
      expect(classifyRiskScore(20.0).categoryCode).toBe('LIGHT_GREEN');
      expect(classifyRiskScore(19.99).categoryCode).toBe('GREEN');
      expect(classifyRiskScore(0.0).categoryCode).toBe('GREEN');
    });
  });

  describe('weightedScore() & classifyHazard()', () => {
    it('reproduces the exact worked example (0.9, 0.7, 0.4, 0.6 -> 0.695 -> Short-term)', () => {
      const score = weightedScore(
        { rainfall: 0.9, slope: 0.7, history: 0.4, riverProximity: 0.6 },
        { rainfall: 0.35, slope: 0.3, history: 0.2, riverProximity: 0.15 }
      );
      expect(score).toBe(0.695);
      expect(classifyHazard(score)).toBe('Short-term');
    });

    it('classifies all four risk cutoffs accurately', () => {
      expect(classifyHazard(0.82)).toBe('Immediate');
      expect(classifyHazard(0.75)).toBe('Short-term');
      expect(classifyHazard(0.5)).toBe('Short-term');
      expect(classifyHazard(0.42)).toBe('Medium-term');
      expect(classifyHazard(0.29)).toBe('Safe');
      expect(classifyHazard(Number.NaN)).toBe('Safe');
    });

    it('handles zero weights, NaN inputs, and null factors without throwing or returning NaN', () => {
      expect(
        weightedScore(
          { rainfall: Number.NaN, slope: 0.5, history: -2, riverProximity: 99 },
          { rainfall: 0, slope: 0, history: 0, riverProximity: 0 }
        )
      ).toBe(0);
      // @ts-expect-error testing null safety at runtime
      expect(weightedScore(null)).toBe(0);
    });
  });


  describe('classifyRiskScore() Standardized 0-100 Non-Overlapping Classification (Section 1 & 9)', () => {
    const testCases: [number, string, string, string][] = [
      [0.0, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [10.0, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [19.99, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [20.0, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [35.0, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [39.99, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [40.0, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [55.0, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [59.99, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [60.0, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [75.0, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [79.99, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [80.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [85.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [92.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [100.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
    ];

    testCases.forEach(([score, expectedCategory, expectedColor, expectedCode]) => {
      it(`classifies score ${score} -> ${expectedCategory} (${expectedColor})`, () => {
        const res = classifyRiskScore(score);
        expect(res.category).toBe(expectedCategory);
        expect(res.colorHex).toBe(expectedColor);
        expect(res.categoryCode).toBe(expectedCode);
        expect(getRiskColorByScore(score)).toBe(expectedColor);
      });
    });

    it('enforces boundary rules: 80 is RED, 79.99 is YELLOW, 60 is YELLOW, 59.99 is ORANGE', () => {
      expect(classifyRiskScore(80.0).categoryCode).toBe('RED');
      expect(classifyRiskScore(79.99).categoryCode).toBe('YELLOW');
      expect(classifyRiskScore(60.0).categoryCode).toBe('YELLOW');
      expect(classifyRiskScore(59.99).categoryCode).toBe('ORANGE');
      expect(classifyRiskScore(40.0).categoryCode).toBe('ORANGE');
      expect(classifyRiskScore(39.99).categoryCode).toBe('LIGHT_GREEN');
      expect(classifyRiskScore(20.0).categoryCode).toBe('LIGHT_GREEN');
      expect(classifyRiskScore(19.99).categoryCode).toBe('GREEN');
      expect(classifyRiskScore(0.0).categoryCode).toBe('GREEN');
    });
  });

  describe('safeComputeHazardScore()', () => {
    it('returns status="ok" when all 4 factors are valid within [0, 1]', () => {
      const res = safeComputeHazardScore({
        rainfall: 0.9,
        slope: 0.7,
        history: 0.4,
        riverProximity: 0.6,
      });
      expect(res.status).toBe('ok');
      expect(res.value).toBe(0.695);
      expect(res.warnings).toHaveLength(0);
    });

    it('returns status="partial" when some factors are null/unknown and excludes them from denominator', () => {
      const res = safeComputeHazardScore({
        rainfall: 0.8,
        slope: 0.6,
        history: null,
        riverProximity: undefined,
      });
      expect(res.status).toBe('partial');
      expect(Number.isFinite(res.value)).toBe(true);
      expect(res.warnings.length).toBeGreaterThanOrEqual(2);
    });

    it('returns status="insufficient" when input is null or all factors are missing', () => {
      expect(safeComputeHazardScore(null).status).toBe('insufficient');
      expect(
        safeComputeHazardScore({
          rainfall: null,
          slope: Number.NaN,
          history: undefined,
          riverProximity: null,
        }).status
      ).toBe('insufficient');
    });
  });


  describe('classifyRiskScore() Standardized 0-100 Non-Overlapping Classification (Section 1 & 9)', () => {
    const testCases: [number, string, string, string][] = [
      [0.0, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [10.0, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [19.99, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [20.0, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [35.0, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [39.99, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [40.0, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [55.0, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [59.99, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [60.0, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [75.0, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [79.99, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [80.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [85.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [92.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [100.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
    ];

    testCases.forEach(([score, expectedCategory, expectedColor, expectedCode]) => {
      it(`classifies score ${score} -> ${expectedCategory} (${expectedColor})`, () => {
        const res = classifyRiskScore(score);
        expect(res.category).toBe(expectedCategory);
        expect(res.colorHex).toBe(expectedColor);
        expect(res.categoryCode).toBe(expectedCode);
        expect(getRiskColorByScore(score)).toBe(expectedColor);
      });
    });

    it('enforces boundary rules: 80 is RED, 79.99 is YELLOW, 60 is YELLOW, 59.99 is ORANGE', () => {
      expect(classifyRiskScore(80.0).categoryCode).toBe('RED');
      expect(classifyRiskScore(79.99).categoryCode).toBe('YELLOW');
      expect(classifyRiskScore(60.0).categoryCode).toBe('YELLOW');
      expect(classifyRiskScore(59.99).categoryCode).toBe('ORANGE');
      expect(classifyRiskScore(40.0).categoryCode).toBe('ORANGE');
      expect(classifyRiskScore(39.99).categoryCode).toBe('LIGHT_GREEN');
      expect(classifyRiskScore(20.0).categoryCode).toBe('LIGHT_GREEN');
      expect(classifyRiskScore(19.99).categoryCode).toBe('GREEN');
      expect(classifyRiskScore(0.0).categoryCode).toBe('GREEN');
    });
  });

  describe('carryingCapacity()', () => {
    it('reproduces the exact MCDA specification example (50 ha ÷ 0.08 = 625 × 0.6 = 375)', () => {
      const cap = carryingCapacity(50, 0.08, 0.6, 175);
      expect(cap.grossCapacity).toBe(625);
      expect(cap.safeCapacity).toBe(375);
      expect(cap.remainingCapacity).toBe(200);
    });

    it('guards against division by zero, negative area, and NaN inputs', () => {
      const zeroCap = carryingCapacity(0, 0, 0, 50);
      expect(zeroCap.safeCapacity).toBe(0);
      expect(zeroCap.remainingCapacity).toBe(0);
      expect(zeroCap.utilizationPct).toBe(100);
      expect(zeroCap.trafficLight).toBe('Red');

      const nanCap = carryingCapacity(Number.NaN, -5, Number.POSITIVE_INFINITY, -10);
      expect(Number.isFinite(nanCap.safeCapacity)).toBe(true);
      expect(nanCap.remainingCapacity).toBeGreaterThanOrEqual(0);
    });
  });


  describe('classifyRiskScore() Standardized 0-100 Non-Overlapping Classification (Section 1 & 9)', () => {
    const testCases: [number, string, string, string][] = [
      [0.0, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [10.0, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [19.99, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [20.0, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [35.0, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [39.99, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [40.0, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [55.0, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [59.99, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [60.0, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [75.0, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [79.99, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [80.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [85.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [92.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [100.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
    ];

    testCases.forEach(([score, expectedCategory, expectedColor, expectedCode]) => {
      it(`classifies score ${score} -> ${expectedCategory} (${expectedColor})`, () => {
        const res = classifyRiskScore(score);
        expect(res.category).toBe(expectedCategory);
        expect(res.colorHex).toBe(expectedColor);
        expect(res.categoryCode).toBe(expectedCode);
        expect(getRiskColorByScore(score)).toBe(expectedColor);
      });
    });

    it('enforces boundary rules: 80 is RED, 79.99 is YELLOW, 60 is YELLOW, 59.99 is ORANGE', () => {
      expect(classifyRiskScore(80.0).categoryCode).toBe('RED');
      expect(classifyRiskScore(79.99).categoryCode).toBe('YELLOW');
      expect(classifyRiskScore(60.0).categoryCode).toBe('YELLOW');
      expect(classifyRiskScore(59.99).categoryCode).toBe('ORANGE');
      expect(classifyRiskScore(40.0).categoryCode).toBe('ORANGE');
      expect(classifyRiskScore(39.99).categoryCode).toBe('LIGHT_GREEN');
      expect(classifyRiskScore(20.0).categoryCode).toBe('LIGHT_GREEN');
      expect(classifyRiskScore(19.99).categoryCode).toBe('GREEN');
      expect(classifyRiskScore(0.0).categoryCode).toBe('GREEN');
    });
  });

  describe('computeVulnerability()', () => {
    it('computes bounded [0, 1] vulnerability score and handles extreme or missing values', () => {
      const score = computeVulnerability({
        elderlyPct: 25,
        bplPct: 40,
        disabledPct: 5,
        healthcareDistKm: 15,
        kutchaHousePct: 45,
      });
      expect(score).toBeGreaterThan(0.3);
      expect(score).toBeLessThan(0.7);
      // @ts-expect-error runtime null check
      expect(computeVulnerability(null)).toBe(0);
    });
  });


  describe('classifyRiskScore() Standardized 0-100 Non-Overlapping Classification (Section 1 & 9)', () => {
    const testCases: [number, string, string, string][] = [
      [0.0, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [10.0, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [19.99, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [20.0, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [35.0, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [39.99, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [40.0, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [55.0, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [59.99, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [60.0, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [75.0, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [79.99, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [80.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [85.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [92.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [100.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
    ];

    testCases.forEach(([score, expectedCategory, expectedColor, expectedCode]) => {
      it(`classifies score ${score} -> ${expectedCategory} (${expectedColor})`, () => {
        const res = classifyRiskScore(score);
        expect(res.category).toBe(expectedCategory);
        expect(res.colorHex).toBe(expectedColor);
        expect(res.categoryCode).toBe(expectedCode);
        expect(getRiskColorByScore(score)).toBe(expectedColor);
      });
    });

    it('enforces boundary rules: 80 is RED, 79.99 is YELLOW, 60 is YELLOW, 59.99 is ORANGE', () => {
      expect(classifyRiskScore(80.0).categoryCode).toBe('RED');
      expect(classifyRiskScore(79.99).categoryCode).toBe('YELLOW');
      expect(classifyRiskScore(60.0).categoryCode).toBe('YELLOW');
      expect(classifyRiskScore(59.99).categoryCode).toBe('ORANGE');
      expect(classifyRiskScore(40.0).categoryCode).toBe('ORANGE');
      expect(classifyRiskScore(39.99).categoryCode).toBe('LIGHT_GREEN');
      expect(classifyRiskScore(20.0).categoryCode).toBe('LIGHT_GREEN');
      expect(classifyRiskScore(19.99).categoryCode).toBe('GREEN');
      expect(classifyRiskScore(0.0).categoryCode).toBe('GREEN');
    });
  });

  describe('greedyMatch()', () => {
    it('ranks habitations descending by Priority and spills over when site capacity fills', () => {
      const ranked = greedyMatch(INITIAL_VILLAGES, INITIAL_RELOCATION_SITES, {
        rainfall: 0.35,
        slope: 0.3,
        history: 0.2,
        riverProximity: 0.15,
      });
      expect(ranked.length).toBe(INITIAL_VILLAGES.length);
      expect(ranked[0]?.rank).toBe(1);
      expect(ranked[0]?.priorityScore).toBeGreaterThanOrEqual(ranked[1]?.priorityScore ?? 0);
    });

    it('handles empty habitation or site arrays without throwing', () => {
      expect(
        greedyMatch([], INITIAL_RELOCATION_SITES, {
          rainfall: 0.35,
          slope: 0.3,
          history: 0.2,
          riverProximity: 0.15,
        })
      ).toEqual([]);

      const noSites = greedyMatch(INITIAL_VILLAGES.slice(0, 2), [], {
        rainfall: 0.35,
        slope: 0.3,
        history: 0.2,
        riverProximity: 0.15,
      });
      expect(noSites).toHaveLength(2);
      expect(noSites[0]?.unallocatedHouseholds).toBe(INITIAL_VILLAGES[0]?.households);
    });
  });


  describe('classifyRiskScore() Standardized 0-100 Non-Overlapping Classification (Section 1 & 9)', () => {
    const testCases: [number, string, string, string][] = [
      [0.0, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [10.0, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [19.99, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [20.0, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [35.0, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [39.99, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [40.0, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [55.0, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [59.99, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [60.0, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [75.0, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [79.99, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [80.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [85.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [92.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [100.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
    ];

    testCases.forEach(([score, expectedCategory, expectedColor, expectedCode]) => {
      it(`classifies score ${score} -> ${expectedCategory} (${expectedColor})`, () => {
        const res = classifyRiskScore(score);
        expect(res.category).toBe(expectedCategory);
        expect(res.colorHex).toBe(expectedColor);
        expect(res.categoryCode).toBe(expectedCode);
        expect(getRiskColorByScore(score)).toBe(expectedColor);
      });
    });

    it('enforces boundary rules: 80 is RED, 79.99 is YELLOW, 60 is YELLOW, 59.99 is ORANGE', () => {
      expect(classifyRiskScore(80.0).categoryCode).toBe('RED');
      expect(classifyRiskScore(79.99).categoryCode).toBe('YELLOW');
      expect(classifyRiskScore(60.0).categoryCode).toBe('YELLOW');
      expect(classifyRiskScore(59.99).categoryCode).toBe('ORANGE');
      expect(classifyRiskScore(40.0).categoryCode).toBe('ORANGE');
      expect(classifyRiskScore(39.99).categoryCode).toBe('LIGHT_GREEN');
      expect(classifyRiskScore(20.0).categoryCode).toBe('LIGHT_GREEN');
      expect(classifyRiskScore(19.99).categoryCode).toBe('GREEN');
      expect(classifyRiskScore(0.0).categoryCode).toBe('GREEN');
    });
  });

  describe('simulateIntervention()', () => {
    it('reduces hazard score deterministically when an engineering intervention is applied', () => {
      const v = INITIAL_VILLAGES[0]!;
      const sim = simulateIntervention(
        v,
        [INTERVENTION_OPTIONS[0]!, INTERVENTION_OPTIONS[1]!],
        { rainfall: 0.35, slope: 0.3, history: 0.2, riverProximity: 0.15 }
      );
      expect(sim.afterScore).toBeLessThanOrEqual(sim.beforeScore);
      expect(sim.totalCostLakhs).toBeGreaterThan(0);
    });
  });


  describe('classifyRiskScore() Standardized 0-100 Non-Overlapping Classification (Section 1 & 9)', () => {
    const testCases: [number, string, string, string][] = [
      [0.0, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [10.0, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [19.99, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [20.0, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [35.0, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [39.99, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [40.0, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [55.0, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [59.99, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [60.0, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [75.0, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [79.99, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [80.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [85.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [92.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [100.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
    ];

    testCases.forEach(([score, expectedCategory, expectedColor, expectedCode]) => {
      it(`classifies score ${score} -> ${expectedCategory} (${expectedColor})`, () => {
        const res = classifyRiskScore(score);
        expect(res.category).toBe(expectedCategory);
        expect(res.colorHex).toBe(expectedColor);
        expect(res.categoryCode).toBe(expectedCode);
        expect(getRiskColorByScore(score)).toBe(expectedColor);
      });
    });

    it('enforces boundary rules: 80 is RED, 79.99 is YELLOW, 60 is YELLOW, 59.99 is ORANGE', () => {
      expect(classifyRiskScore(80.0).categoryCode).toBe('RED');
      expect(classifyRiskScore(79.99).categoryCode).toBe('YELLOW');
      expect(classifyRiskScore(60.0).categoryCode).toBe('YELLOW');
      expect(classifyRiskScore(59.99).categoryCode).toBe('ORANGE');
      expect(classifyRiskScore(40.0).categoryCode).toBe('ORANGE');
      expect(classifyRiskScore(39.99).categoryCode).toBe('LIGHT_GREEN');
      expect(classifyRiskScore(20.0).categoryCode).toBe('LIGHT_GREEN');
      expect(classifyRiskScore(19.99).categoryCode).toBe('GREEN');
      expect(classifyRiskScore(0.0).categoryCode).toBe('GREEN');
    });
  });

  describe('geofenceCheck(), floodFill(), elevationProfile(), buildRationale()', () => {
    it('detects geofence proximity and nearest relief camp', () => {
      const v = INITIAL_VILLAGES[0]!;
      const geo = geofenceCheck(v.lat, v.lng, INITIAL_VILLAGES, INITIAL_RELIEF_CAMPS);
      expect(geo.nearestCamp).not.toBeNull();
      expect(geo.distanceToShelterKm).toBeGreaterThanOrEqual(0);
    });

    it('computes 3D flood inundation cells for water level rise 0..15m', () => {
      const zeroFlood = floodFill(0, INITIAL_VILLAGES, INITIAL_RELIEF_CAMPS);
      expect(zeroFlood.cells).toHaveLength(0);

      const highFlood = floodFill(10, INITIAL_VILLAGES, INITIAL_RELIEF_CAMPS);
      expect(highFlood.cells.length).toBeGreaterThan(0);
      expect(highFlood.affectedHouseholds).toBeGreaterThan(0);
    });

    it('computes elevation profile and line-of-sight between two coordinates', () => {
      const prof = elevationProfile(
        [
          [18.9265, 73.2361],
          [18.0812, 73.4188],
        ],
        INITIAL_VILLAGES,
        12
      );
      expect(prof.points).toHaveLength(13);
      expect(prof.totalDistanceKm).toBeGreaterThan(10);
      expect(typeof prof.hasLineOfSight).toBe('boolean');
    });

    it('builds deterministic plain-language rationale in English, Hindi, and Marathi', () => {
      const payload = {
        scoreType: 'hazard' as const,
        villageName: 'Irshalwadi',
        district: 'Raigad',
        title: 'Irshalwadi',
        subtitle: 'Raigad',
        totalScore: 0.892,
        classificationLabel: 'Immediate Red Zone',
        classificationColor: '#B91C1C',
        formulaText: '0.35*Rain + 0.30*Slope + 0.20*History + 0.15*River',
        contextNotes: ['3 landslide events recorded in 5 years'],
        factors: [
          {
            name: 'Monsoon Rainfall Intensity',
            rawDisplay: '3950 mm',
            normalizedValue: 0.94,
            weight: 0.35,
            contribution: 0.329,
            percentageOfScore: 37,
            color: '#0B8F80',
          },
          {
            name: 'Terrain Slope Gradient',
            rawDisplay: '38°',
            normalizedValue: 0.91,
            weight: 0.3,
            contribution: 0.273,
            percentageOfScore: 31,
            color: '#EA580C',
          },
        ],
      };
      expect(buildRationale(payload, 'en', 40)).toContain('Irshalwadi');
      expect(buildRationale(payload, 'hi', 40)).toContain('Irshalwadi');
      expect(buildRationale(payload, 'mr', 40)).toContain('Irshalwadi');
    });
  });


  describe('classifyRiskScore() Standardized 0-100 Non-Overlapping Classification (Section 1 & 9)', () => {
    const testCases: [number, string, string, string][] = [
      [0.0, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [10.0, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [19.99, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [20.0, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [35.0, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [39.99, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [40.0, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [55.0, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [59.99, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [60.0, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [75.0, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [79.99, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [80.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [85.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [92.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [100.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
    ];

    testCases.forEach(([score, expectedCategory, expectedColor, expectedCode]) => {
      it(`classifies score ${score} -> ${expectedCategory} (${expectedColor})`, () => {
        const res = classifyRiskScore(score);
        expect(res.category).toBe(expectedCategory);
        expect(res.colorHex).toBe(expectedColor);
        expect(res.categoryCode).toBe(expectedCode);
        expect(getRiskColorByScore(score)).toBe(expectedColor);
      });
    });

    it('enforces boundary rules: 80 is RED, 79.99 is YELLOW, 60 is YELLOW, 59.99 is ORANGE', () => {
      expect(classifyRiskScore(80.0).categoryCode).toBe('RED');
      expect(classifyRiskScore(79.99).categoryCode).toBe('YELLOW');
      expect(classifyRiskScore(60.0).categoryCode).toBe('YELLOW');
      expect(classifyRiskScore(59.99).categoryCode).toBe('ORANGE');
      expect(classifyRiskScore(40.0).categoryCode).toBe('ORANGE');
      expect(classifyRiskScore(39.99).categoryCode).toBe('LIGHT_GREEN');
      expect(classifyRiskScore(20.0).categoryCode).toBe('LIGHT_GREEN');
      expect(classifyRiskScore(19.99).categoryCode).toBe('GREEN');
      expect(classifyRiskScore(0.0).categoryCode).toBe('GREEN');
    });
  });

  describe('Section 6 & 12 Decision Engine Pure Functions', () => {
    it('computeExposure() computes normalized 0-100 exposure score and handles missing inputs', () => {
      const exp = computeExposure(1200, 180, 0.8);
      expect(exp.status).toBe('ok');
      expect(exp.value).toBeGreaterThan(20);
      expect(exp.value).toBeLessThanOrEqual(100);

      const missing = computeExposure(null, undefined, 0.5);
      expect(missing.status).toBe('insufficient');
      expect(missing.value).toBe(0);
    });

    it('overallRisk() combines Hazard, Exposure, and Vulnerability (0-100) with partial/insufficient safety', () => {
      const r = overallRisk(90, 70, 80);
      // 0.45*90 + 0.25*70 + 0.30*80 = 40.5 + 17.5 + 24 = 82
      expect(r.status).toBe('ok');
      expect(r.value).toBe(82);

      const partial = overallRisk(80, null, 60);
      expect(partial.status).toBe('partial');
      expect(partial.value).toBeGreaterThan(0);

      const insufficient = overallRisk(null, undefined, Number.NaN);
      expect(insufficient.status).toBe('insufficient');
    });

    it('capacityFromConstraints() returns min of land, water, and infrastructure and formats binding label', () => {
      const res = capacityFromConstraints(2500, 2000, 2300, 500);
      expect(res.effectiveCapacity).toBe(2000);
      expect(res.remainingCapacity).toBe(1500);
      expect(res.bindingConstraint).toBe('water');
      expect(res.bindingLabel).toContain('Limited by water');
    });

    it('validateAllocation() enforces no site overflow and flags unassigned red zone habitations', () => {
      const weights = {
        rainfall: 0.35,
        slope: 0.3,
        history: 0.2,
        riverProximity: 0.15,
      };
      const ranked = greedyMatch(INITIAL_VILLAGES, INITIAL_RELOCATION_SITES, weights);
      const validation = validateAllocation(ranked, INITIAL_RELOCATION_SITES, weights);
      expect(validation.valid).toBe(true);
      expect(validation.violations).toHaveLength(0);
    });

    it('simulateScenario() compares baseline vs scenario and labels as simulation not forecast', () => {
      const weights = {
        rainfall: 0.35,
        slope: 0.3,
        history: 0.2,
        riverProximity: 0.15,
      };
      const sim = simulateScenario(INITIAL_VILLAGES, INITIAL_RELOCATION_SITES, weights, {
        extraRainfallMm: 600,
        climateHorizon: 'plus20',
      });
      expect(sim.label).toBe('Scenario simulation. Not a forecast.');
      expect(sim.scenarioRanked).toHaveLength(INITIAL_VILLAGES.length);
      expect(sim.scenarioUnassignedHh).toBeGreaterThanOrEqual(sim.baselineUnassignedHh);
    });

    it('safeParse() validates coordinate bounds and India bounding box without throwing', () => {
      const ok = safeParse({ lat: 18.9265, lng: 73.2361 });
      expect(ok.valid).toBe(true);
      expect(ok.withinIndiaBounds).toBe(true);
      expect(ok.lat).toBe(18.9265);

      const outOfIndia = safeParse({ lat: 51.5074, lng: -0.1278 });
      expect(outOfIndia.valid).toBe(true);
      expect(outOfIndia.withinIndiaBounds).toBe(false);
      expect(outOfIndia.warnings.length).toBeGreaterThan(0);

      const bad = safeParse({ lat: 195, lng: 'invalid' });
      expect(bad.valid).toBe(false);
      expect(bad.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('classifyRiskScore() Standardized 0-100 Non-Overlapping Classification (Section 1 & 9)', () => {
    const testCases: [number, string, string, string][] = [
      [0.0, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [10.0, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [19.99, 'VERY LOW RISK', '#16A34A', 'GREEN'],
      [20.0, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [35.0, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [39.99, 'LOW RISK', '#84CC16', 'LIGHT_GREEN'],
      [40.0, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [55.0, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [59.99, 'MODERATE RISK', '#F97316', 'ORANGE'],
      [60.0, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [75.0, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [79.99, 'HIGH RISK', '#EAB308', 'YELLOW'],
      [80.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [85.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [92.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
      [100.0, 'VERY HIGH RISK', '#DC2626', 'RED'],
    ];

    testCases.forEach(([score, expectedCategory, expectedColor, expectedCode]) => {
      it(`classifies score ${score} -> ${expectedCategory} (${expectedColor})`, () => {
        const res = classifyRiskScore(score);
        expect(res.category).toBe(expectedCategory);
        expect(res.colorHex).toBe(expectedColor);
        expect(res.categoryCode).toBe(expectedCode);
        expect(getRiskColorByScore(score)).toBe(expectedColor);
      });
    });

    it('enforces boundary rules: 80 is RED, 79.99 is YELLOW, 60 is YELLOW, 59.99 is ORANGE', () => {
      expect(classifyRiskScore(80.0).categoryCode).toBe('RED');
      expect(classifyRiskScore(79.99).categoryCode).toBe('YELLOW');
      expect(classifyRiskScore(60.0).categoryCode).toBe('YELLOW');
      expect(classifyRiskScore(59.99).categoryCode).toBe('ORANGE');
      expect(classifyRiskScore(40.0).categoryCode).toBe('ORANGE');
      expect(classifyRiskScore(39.99).categoryCode).toBe('LIGHT_GREEN');
      expect(classifyRiskScore(20.0).categoryCode).toBe('LIGHT_GREEN');
      expect(classifyRiskScore(19.99).categoryCode).toBe('GREEN');
      expect(classifyRiskScore(0.0).categoryCode).toBe('GREEN');
    });
  });
});
