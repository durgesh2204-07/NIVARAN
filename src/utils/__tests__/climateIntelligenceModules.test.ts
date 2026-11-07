import { describe, it, expect } from 'vitest';
import {
  calculateVillageVulnerability,
  getAllVillageVulnerabilityAssessments,
  getTopVulnerableVillages,
  predictClimateImpact,
  generateDetectedClimateAnomalies,
  getAllDetectedClimateAnomalies,
  IMPACT_CATEGORIES,
  ANOMALY_TYPES,
} from '../../services/climateIntelligenceModules';
import { MASTER_MAHARASHTRA_VILLAGES } from '../../data/maharashtraMasterVillages';

describe('NIVARAN AI Climate Intelligence Modules', () => {
  const testVillage = MASTER_MAHARASHTRA_VILLAGES[0]; // Irshalwadi

  describe('Module 1: Village Climate Vulnerability Score', () => {
    it('calculates score between 0 and 100 for a village', () => {
      const assessment = calculateVillageVulnerability(testVillage);
      expect(assessment.vulnerabilityScore).toBeGreaterThanOrEqual(0);
      expect(assessment.vulnerabilityScore).toBeLessThanOrEqual(100);
      expect(['Very Low', 'Low', 'Moderate', 'High', 'Very High']).toContain(assessment.tier);
    });

    it('provides exactly 7 transparent factor scores summing to 100% weight', () => {
      const assessment = calculateVillageVulnerability(testVillage);
      expect(assessment.factors).toHaveLength(7);
      const totalWeight = assessment.factors.reduce((sum, f) => sum + f.weightPct, 0);
      expect(totalWeight).toBe(100);
    });

    it('generates authentic Cadastral GeoJSON boundary polygons', () => {
      const assessment = calculateVillageVulnerability(testVillage);
      expect(assessment.boundaryPolygon.type).toBe('Feature');
      expect(assessment.boundaryPolygon.geometry.type).toBe('Polygon');
      expect(assessment.boundaryPolygon.geometry.coordinates[0].length).toBeGreaterThan(5);
      expect(assessment.boundaryPolygon.properties.areaHectares).toBeGreaterThan(200);
    });

    it('loads statewide assessments and ranks top vulnerable villages properly', () => {
      const all = getAllVillageVulnerabilityAssessments();
      expect(all.length).toBeGreaterThan(100);
      expect(all[0].stateRank).toBe(1);
      expect(all[0].vulnerabilityScore).toBeGreaterThanOrEqual(all[all.length - 1].vulnerabilityScore);

      const top10 = getTopVulnerableVillages(10);
      expect(top10).toHaveLength(10);
      expect(top10[0].vulnerabilityScore).toBeGreaterThanOrEqual(top10[9].vulnerabilityScore);
    });

    it('provides transparent AI explainability and prioritized adaptation measures', () => {
      const assessment = calculateVillageVulnerability(testVillage);
      expect(assessment.explanation.summary).toContain(testVillage.name);
      expect(assessment.explanation.primaryDriver.length).toBeGreaterThan(3);
      expect(assessment.explanation.environmentalThreats.length).toBeGreaterThan(0);
      expect(assessment.explanation.prioritizedAdaptationMeasures.length).toBeGreaterThan(1);
      expect(assessment.explanation.scoringMethodology).toContain('IPCC AR6');
    });
  });

  describe('Module 2: AI Climate Impact Prediction', () => {
    it('runs predictions across all 8 impact categories and 3 horizons', () => {
      for (const cat of IMPACT_CATEGORIES) {
        const pred = predictClimateImpact(testVillage, cat.id, 'horizon_24_72h');
        expect(pred.category).toBe(cat.id);
        expect(pred.categoryName).toBe(cat.name);
        expect(pred.confidencePct).toBeGreaterThanOrEqual(80);
        expect(pred.confidencePct).toBeLessThanOrEqual(100);
        expect(pred.estimates.exposedPopulation).toBeGreaterThanOrEqual(0);
        expect(['Critical', 'High', 'Moderate', 'Low']).toContain(pred.severityLevel);
        expect(pred.mitigationMeasures.immediateActions.length).toBeGreaterThan(0);
      }
    });

    it('correctly calculates forecast delta percentage and trend', () => {
      const pred = predictClimateImpact(testVillage, 'flood_impact', 'horizon_seasonal');
      expect(typeof pred.forecast.deltaPct).toBe('number');
      expect(['increasing', 'decreasing', 'stable']).toContain(pred.forecast.trend);
    });
  });

  describe('Module 3: Climate Anomaly Detection', () => {
    it('generates anomalies with 30-year baseline comparison and Z-score metrics', () => {
      const anomalies = generateDetectedClimateAnomalies();
      expect(anomalies.length).toBeGreaterThan(20);

      const first = anomalies[0];
      expect(first.baselinePeriod).toContain('1991–2020 IMD');
      expect(typeof first.zScore).toBe('number');
      expect(Math.abs(first.zScore)).toBeGreaterThan(0);
      expect(['Critical', 'High', 'Moderate', 'Low']).toContain(first.severity);
      expect(first.explanation.recommendedFieldActions.length).toBeGreaterThan(0);
    });

    it('classifies Critical anomalies when |Z| >= 3.0 or deviation >= 75%', () => {
      const all = getAllDetectedClimateAnomalies();
      const criticals = all.filter((a) => a.severity === 'Critical');
      expect(criticals.length).toBeGreaterThan(0);
      criticals.forEach((c) => {
        expect(Math.abs(c.zScore) >= 3.0 || Math.abs(c.deviationPct) >= 75).toBe(true);
      });
    });
  });
});

