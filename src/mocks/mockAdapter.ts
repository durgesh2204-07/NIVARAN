import {
  INITIAL_DATA_SOURCES,
  INITIAL_RELOCATION_SITES,
  INITIAL_VILLAGES,
} from '../data/mockData';
import {
  DEFAULT_WEIGHTS,
} from '../store/useAppStore';
import {
  capacityFromConstraints,
  classifyHazard,
  greedyMatch,
  simulateScenario,
  validateAllocation,
  weightedScore,
} from '../utils/scoring';

export interface MockHealthResponse {
  status: 'operational' | 'degraded';
  mode: 'synthetic-adapter';
  syntheticLabel: string;
  timestampIst: string;
}

export interface MockModelEntry {
  id: string;
  name: string;
  version: string;
  type: 'weighted_index' | 'trained_model';
  trainingDates: string;
  splitStrategy: string;
  features: string[];
  note: string;
}

export const SYNTHETIC_ADAPTER_BANNER = 'Backend not connected · Synthetic sample data';

export const mockContractAdapter = {
  getHealth(): MockHealthResponse {
    return {
      status: 'operational',
      mode: 'synthetic-adapter',
      syntheticLabel: SYNTHETIC_ADAPTER_BANNER,
      timestampIst: new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
      }),
    };
  },

  getVillagesGeoJson() {
    return {
      type: 'FeatureCollection' as const,
      metadata: {
        source: 'seed',
        synthetic: true,
        methodVersion: 'Weighted index v2.4-NDMA-2026',
      },
      features: INITIAL_VILLAGES.map((v) => {
        const score = weightedScore(v.hazardFactors, DEFAULT_WEIGHTS, v.verifiedReportsCount);
        return {
          type: 'Feature' as const,
          properties: {
            ...v,
            source: 'seed',
            hazardScore: score,
            riskLevel: classifyHazard(score),
            methodBadge: 'Weighted index v2.4',
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [v.lng, v.lat],
          },
        };
      }),
    };
  },

  getSitesGeoJson() {
    return {
      type: 'FeatureCollection' as const,
      metadata: {
        source: 'seed',
        synthetic: true,
      },
      features: INITIAL_RELOCATION_SITES.map((s) => {
        const landPeople = Math.round((s.usableAreaHa / s.landPerHouseholdHa) * 4.5);
        const waterPeople = Math.round(landPeople * s.waterReliabilityScore);
        const infraPeople = Math.round(landPeople * 0.92);
        const cap = capacityFromConstraints(
          landPeople,
          waterPeople,
          infraPeople,
          s.existingOccupiedHouseholds * 4.5
        );
        return {
          type: 'Feature' as const,
          properties: {
            ...s,
            source: 'seed',
            capacityConstraint: cap,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [s.lng, s.lat],
          },
        };
      }),
    };
  },

  getCells(hazard = 'landslide') {
    return {
      effectiveResolutionMeters: 30,
      hazard,
      methodBadge: 'Weighted index v2.4-NDMA-2026',
      synthetic: true,
      cells: INITIAL_VILLAGES.slice(0, 20).map((v, idx) => ({
        cell_id: `CELL-MH-${1040 + idx}`,
        villageId: v.id,
        villageName: v.name,
        lat: v.lat,
        lng: v.lng,
        score0to100: Math.round(
          weightedScore(v.hazardFactors, DEFAULT_WEIGHTS, v.verifiedReportsCount) * 100
        ),
        methodBadge: 'Weighted index v2.4',
        sourceDate: '2026-10-10',
      })),
    };
  },

  getSummary() {
    const ranked = greedyMatch(INITIAL_VILLAGES, INITIAL_RELOCATION_SITES, DEFAULT_WEIGHTS);
    const validation = validateAllocation(ranked, INITIAL_RELOCATION_SITES, DEFAULT_WEIGHTS);
    const highRisk = ranked.filter((r) => r.riskLevel === 'Immediate');
    return {
      villagesAssessed: INITIAL_VILLAGES.length,
      highRiskVillages: highRisk.length,
      peopleExposed: highRisk.reduce((s, r) => s + r.village.population, 0),
      householdsNeedingRelocation: highRisk.reduce((s, r) => s + r.village.households, 0),
      eligibleSites: INITIAL_RELOCATION_SITES.length,
      unassignedHouseholds: validation.totalUnassignedHouseholds,
      unassignedPopulation: validation.totalUnassignedPopulation,
      methodBadge: 'Weighted index v2.4-NDMA-2026',
      synthetic: true,
    };
  },

  getSources() {
    return INITIAL_DATA_SOURCES.map((ds) => ({
      ...ds,
      source: 'seed',
      synthetic: true,
    }));
  },

  getPipelineStatus() {
    return {
      checkpointRule: 'No duplicate cell_id; no misaligned joins',
      trainedModelRegistered: false,
      activeMethodBadge: 'Weighted index v2.4-NDMA-2026',
      stagesCompleted: 9,
      stagesTotal: 10,
    };
  },

  getModels(): MockModelEntry[] {
    return [
      {
        id: 'weighted-index-v2.4',
        name: 'Weighted Multi-Hazard Index',
        version: 'v2.4-NDMA-2026',
        type: 'weighted_index',
        trainingDates: 'Not applicable (deterministic weighted index)',
        splitStrategy: 'Rule-calibrated thresholds (>0.75 / 0.50 / 0.30)',
        features: ['rainfall (0.35)', 'slope (0.30)', 'history (0.20)', 'riverProximity (0.15)'],
        note: 'No trained model registered. Showing weighted index. A cell with no recorded event is not guaranteed to be a true negative.',
      },
    ];
  },

  postAllocate(weights = DEFAULT_WEIGHTS) {
    const ranked = greedyMatch(INITIAL_VILLAGES, INITIAL_RELOCATION_SITES, weights);
    const validation = validateAllocation(ranked, INITIAL_RELOCATION_SITES, weights);
    return {
      ranked,
      validation,
      methodBadge: 'Weighted index v2.4-NDMA-2026',
      synthetic: true,
    };
  },

  postScenario(params: { extraRainfallMm?: number; unavailableSiteIds?: string[] }) {
    return simulateScenario(
      INITIAL_VILLAGES,
      INITIAL_RELOCATION_SITES,
      DEFAULT_WEIGHTS,
      params
    );
  },

  getVoiceAlerts(currentList: unknown[]) {
    return {
      items: currentList,
      synthetic: true,
    };
  },

  postVoiceAlert(payload: {
    audioMimeType: string;
    audioSizeBytes: number;
    durationSeconds: number;
    lat: number;
    lng: number;
    accuracyMeters: number;
    userId: string;
    userName: string;
    phone?: string;
    district: string;
    controlRoomTarget: string;
    audioUrl?: string;
    transcriptSummary?: string;
  }) {
    const allowedMime = /^audio\/(webm|mp4|mpeg|ogg|wav)/i.test(payload.audioMimeType);
    if (!allowedMime) {
      throw new Error('Unsupported audio format. Allowed: webm, mp4, ogg, wav.');
    }
    if (payload.durationSeconds > 30) {
      throw new Error('Voice Alert exceeds 30 second maximum recording limit.');
    }
    if (payload.audioSizeBytes > 2 * 1024 * 1024) {
      throw new Error('Audio exceeds 2 MB upload limit (~64 kbps Opus/AAC).');
    }
    const nowIst =
      new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      }) + ' IST';
    return {
      accepted: true,
      deliveredAtIst: nowIst,
      receivedAtIst: nowIst,
      controlRoomTarget: payload.controlRoomTarget,
    };
  },

  patchVoiceAlertStatus(id: string, status: string, actor: string) {
    return {
      id,
      status,
      actor,
      updatedAtIst:
        new Date().toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
        }) + ' IST',
    };
  },

  getSosAlerts(currentList: unknown[]) {
    return {
      items: currentList,
      synthetic: true,
    };
  },

  postSosAlert(payload: {
    lat: number;
    lng: number;
    accuracyMeters: number;
    timestamp: string;
    userId: string;
    userName: string;
    phone?: string;
    district: string;
    controlRoomTarget: string;
  }) {
    if (
      typeof payload.lat !== 'number' ||
      typeof payload.lng !== 'number' ||
      Number.isNaN(payload.lat) ||
      Number.isNaN(payload.lng)
    ) {
      throw new Error('Invalid GPS coordinates for Emergency SOS.');
    }
    const nowIst =
      new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      }) + ' IST';
    return {
      accepted: true,
      deliveredAtIst: nowIst,
      controlRoomTarget: payload.controlRoomTarget,
      priority: 'Highest (SOS)',
    };
  },

  patchSosAlertStatus(id: string, status: string, actor: string) {
    return {
      id,
      status,
      actor,
      updatedAtIst:
        new Date().toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
        }) + ' IST',
    };
  },
};

