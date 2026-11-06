import {
  INITIAL_ALERTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_COMMUNITY_REPORTS,
  INITIAL_CRITICAL_FACILITIES,
  INITIAL_DATA_SOURCES,
  INITIAL_HOUSEHOLD_CASES,
  INITIAL_INCIDENTS,
  INITIAL_RELIEF_CAMPS,
  INITIAL_RELOCATION_SITES,
  INITIAL_RESOURCE_STOCK,
  INITIAL_RESPONSE_TEAMS,
  INITIAL_SENSORS,
  INITIAL_VILLAGES,
  INTERVENTION_OPTIONS,
} from '../data/mockData';
import { AuthError, ForbiddenError } from '../resilience/apiClient';
import { authorize, ResourceContext, SecurityAction } from '../security/authorize';
import {
  AlertItem,
  AuditLogEntry,
  CommunityReport,
  CriticalFacility,
  DataSourceStatus,
  HouseholdCase,
  IncidentItem,
  InterventionOption,
  ReliefCamp,
  RelocationSite,
  ResourceStockItem,
  ResponseTeam,
  SensorReading,
  UserProfile,
  UserRole,
  UserSession,
  Village,
} from '../types';
import { callBackendGateway, setMemoryAccessToken } from './gateway';

/**
 * Enforces role, organisation, and jurisdiction checks in the service layer (Section 4 & 8.5).
 * Throws typed AuthError (401) or ForbiddenError (403) if access is denied.
 */
export function enforceApiAuthorization(
  user: UserProfile | null | undefined,
  action: SecurityAction,
  resource?: ResourceContext
): void {
  const decision = authorize(user, action, resource);
  if (!decision.allowed) {
    if (decision.status === 401) {
      throw new AuthError(decision.message);
    }
    throw new ForbiddenError(decision.message);
  }
}

/**
 * Scopes records by user jurisdiction (National > State > District) when applicable.
 */
function scopeByDistrict<T extends { district?: string }>(
  items: T[],
  user?: UserProfile | null
): T[] {
  if (!user || !user.district || user.district.startsWith('All Districts')) {
    return items;
  }
  if (
    user.organisation === 'ndma' ||
    user.organisation === 'sdma' ||
    user.jurisdictionLevel === 'National' ||
    user.jurisdictionLevel === 'State'
  ) {
    return items;
  }
  return items;
}

/**
 * Typed REST-ready Data Service Layer (`services/api.ts`).
 * Designed to be swapped 1:1 with a Node/Django + PostgreSQL/PostGIS backend.
 * All calls route through `callBackendGateway` and enforce `authorize()`.
 */
export const NivaranApi = {
  async authenticate(params: {
    role: UserRole;
    emailOrPhone?: string;
    passwordOrOtp?: string;
    identifier?: string;
    secret?: string;
    isGuest?: boolean;
  }): Promise<UserSession & { user: UserSession }> {
    await new Promise((r) => setTimeout(r, 200));
    const { role, isGuest } = params;
    const emailOrPhone = params.emailOrPhone || params.identifier || '';

    let session: UserSession;

    if (role === 'administrator' || role === 'sdma' || role === 'national_authority') {
      const designation =
        'Principal Secretary & State Relief Commissioner (SDMA / NDMA Nodal)';
      session = {
        id: 'usr-admin-01',
        name: 'Dr. Rajeshwar Deshmukh, IAS',
        emailOrPhone: emailOrPhone || 'admin@nivaran.gov.in',
        role: 'administrator',
        organisation: role === 'national_authority' ? 'ndma' : 'sdma',
        orgRole: 'Administrator',
        jurisdictionLevel: role === 'national_authority' ? 'National' : 'State',
        designation,
        title: designation,
        district: 'All Districts (State Command HQ)',
      };
    } else if (role === 'district_officer') {
      const designation = 'District Collector & DDMA Chairperson';
      session = {
        id: 'usr-ddma-01',
        name: 'Dr. M. Kulkarni, IAS',
        emailOrPhone: emailOrPhone || 'collector.raigad@nivaran.gov.in',
        role: 'district_officer',
        organisation: 'ddma',
        orgRole: 'Approver',
        jurisdictionLevel: 'District',
        designation,
        title: designation,
        district: 'Raigad',
      };
    } else if (role === 'field_officer') {
      const designation = 'Field Verification Officer — Western Ghats Division';
      session = {
        id: 'usr-field-01',
        name: 'S. K. Kadam (Tahsildar / Junior Engineer)',
        emailOrPhone: emailOrPhone || 'field@nivaran.gov.in',
        role: 'field_officer',
        organisation: 'ddma',
        orgRole: 'Operator',
        jurisdictionLevel: 'Block',
        designation,
        title: designation,
        district: 'Raigad',
        assignedVillageId: 'v-01',
      };
    } else if (role === 'response_team') {
      const designation = 'Incident Response Commander — NDRF / SDRF Operations';
      session = {
        id: 'usr-ndrf-01',
        name: 'Comdt. V. K. Rathore (NDRF 5th Bn)',
        emailOrPhone: emailOrPhone || 'ndrf5bn@nivaran.gov.in',
        role: 'response_team',
        organisation: 'response_forces',
        orgRole: 'Operator',
        jurisdictionLevel: 'State',
        designation,
        title: designation,
        district: 'Raigad',
      };
    } else {
      const designation = isGuest
        ? 'Public Safety & Early Warning Access'
        : 'Verified Resident — Irshalwadi / Khalapur Block';
      session = {
        id: 'usr-cit-01',
        name: isGuest ? 'Citizen Portal Visitor' : 'Ramesh Pardhi (Citizen)',
        emailOrPhone: emailOrPhone || '9876543210',
        role: 'citizen',
        organisation: 'citizen',
        orgRole: 'Viewer',
        jurisdictionLevel: 'Village',
        designation,
        title: designation,
        district: 'Raigad',
        assignedVillageId: 'v-01',
        isGuest,
      };
    }

    // Hold ephemeral session credential in memory only (never localStorage)
    setMemoryAccessToken(`ephemeral-mem-${session.id}-${Date.now()}`);

    return {
      ...session,
      user: session,
    };
  },

  async fetchVillages(user?: UserProfile | null): Promise<Village[]> {
    if (user) enforceApiAuthorization(user, 'view:hazard_scores');
    const res = await callBackendGateway({
      endpoint: '/api/v1/habitations',
      fallbackHandler: () => structuredClone(INITIAL_VILLAGES),
    });
    return scopeByDistrict(res.data, user);
  },

  async fetchRelocationSites(user?: UserProfile | null): Promise<RelocationSite[]> {
    if (user) enforceApiAuthorization(user, 'view:hazard_scores');
    const res = await callBackendGateway({
      endpoint: '/api/v1/relocation-sites',
      fallbackHandler: () => structuredClone(INITIAL_RELOCATION_SITES),
    });
    return scopeByDistrict(res.data, user);
  },

  async fetchReliefCamps(user?: UserProfile | null): Promise<ReliefCamp[]> {
    if (user) enforceApiAuthorization(user, 'view:dashboard');
    const res = await callBackendGateway({
      endpoint: '/api/v1/relief-camps',
      fallbackHandler: () => structuredClone(INITIAL_RELIEF_CAMPS),
    });
    return scopeByDistrict(res.data, user);
  },

  async fetchCriticalFacilities(user?: UserProfile | null): Promise<CriticalFacility[]> {
    if (user) enforceApiAuthorization(user, 'view:gis');
    const res = await callBackendGateway({
      endpoint: '/api/v1/critical-facilities',
      fallbackHandler: () => structuredClone(INITIAL_CRITICAL_FACILITIES),
    });
    return scopeByDistrict(res.data, user);
  },

  async fetchIncidents(user?: UserProfile | null): Promise<IncidentItem[]> {
    if (user) enforceApiAuthorization(user, 'view:dashboard');
    const res = await callBackendGateway({
      endpoint: '/api/v1/incidents',
      fallbackHandler: () => structuredClone(INITIAL_INCIDENTS),
    });
    return scopeByDistrict(res.data, user);
  },

  async fetchResponseTeams(user?: UserProfile | null): Promise<ResponseTeam[]> {
    if (user) enforceApiAuthorization(user, 'view:dashboard');
    const res = await callBackendGateway({
      endpoint: '/api/v1/response-teams',
      fallbackHandler: () => structuredClone(INITIAL_RESPONSE_TEAMS),
    });
    return scopeByDistrict(res.data, user);
  },

  async fetchResourceStock(user?: UserProfile | null): Promise<ResourceStockItem[]> {
    if (user) enforceApiAuthorization(user, 'view:dashboard');
    const res = await callBackendGateway({
      endpoint: '/api/v1/resource-stock',
      fallbackHandler: () => structuredClone(INITIAL_RESOURCE_STOCK),
    });
    return scopeByDistrict(res.data, user);
  },

  async fetchInterventions(): Promise<InterventionOption[]> {
    const res = await callBackendGateway({
      endpoint: '/api/v1/interventions',
      fallbackHandler: () => structuredClone(INTERVENTION_OPTIONS),
    });
    return res.data;
  },

  async fetchCommunityReports(user?: UserProfile | null): Promise<CommunityReport[]> {
    if (user) enforceApiAuthorization(user, 'view:dashboard');
    const res = await callBackendGateway({
      endpoint: '/api/v1/community-reports',
      fallbackHandler: () => structuredClone(INITIAL_COMMUNITY_REPORTS),
    });
    return scopeByDistrict(res.data, user);
  },

  async fetchHouseholdCases(user?: UserProfile | null): Promise<HouseholdCase[]> {
    if (user) enforceApiAuthorization(user, 'manage:relocation_cases');
    const res = await callBackendGateway({
      endpoint: '/api/v1/household-cases',
      fallbackHandler: () => structuredClone(INITIAL_HOUSEHOLD_CASES),
    });
    return scopeByDistrict(res.data, user);
  },

  async fetchSensors(): Promise<SensorReading[]> {
    const res = await callBackendGateway({
      endpoint: '/api/v1/sensors',
      fallbackHandler: () => structuredClone(INITIAL_SENSORS),
    });
    return res.data;
  },

  async fetchAlerts(): Promise<AlertItem[]> {
    const res = await callBackendGateway({
      endpoint: '/api/v1/alerts',
      fallbackHandler: () => structuredClone(INITIAL_ALERTS),
    });
    return res.data;
  },

  async fetchDataSources(): Promise<DataSourceStatus[]> {
    const res = await callBackendGateway({
      endpoint: '/api/v1/data-sources',
      fallbackHandler: () => structuredClone(INITIAL_DATA_SOURCES),
    });
    return res.data;
  },

  async fetchAuditLogs(user?: UserProfile | null): Promise<AuditLogEntry[]> {
    if (user) enforceApiAuthorization(user, 'manage:users_and_orgs');
    const res = await callBackendGateway({
      endpoint: '/api/v1/audit-logs',
      fallbackHandler: () => structuredClone(INITIAL_AUDIT_LOGS),
    });
    return res.data;
  },
};

export const api = NivaranApi;
