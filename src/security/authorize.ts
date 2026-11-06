import { OrgRole, OrganisationType, UserProfile } from '../types';

export type SecurityAction =
  | 'view:dashboard'
  | 'view:gis'
  | 'view:hazard_scores'
  | 'edit:scoring_weights'
  | 'approve:relocation_plan'
  | 'issue:cap_alert'
  | 'approve:red_alert'
  | 'manage:incidents'
  | 'verify:community_report'
  | 'manage:resources'
  | 'manage:relocation_cases'
  | 'reveal:sensitive_pii'
  | 'export:personal_data'
  | 'manage:datasets'
  | 'manage:users_and_orgs'
  | 'submit:public_sos'
  | 'submit:public_report';

export interface ResourceContext {
  organisation?: OrganisationType;
  state?: string;
  district?: string;
  taluka?: string;
  villageId?: string;
  assignedUnit?: string;
  resourceType?: 'weather' | 'land' | 'incident' | 'relief_task' | 'general';
}

export interface AuthorizationDecision {
  allowed: boolean;
  status: 200 | 401 | 403;
  code: 'AUTHORIZED' | 'UNAUTHENTICATED' | 'FORBIDDEN_ROLE' | 'FORBIDDEN_ORG' | 'FORBIDDEN_JURISDICTION';
  message: string;
}

const PUBLIC_ACTIONS: ReadonlySet<SecurityAction> = new Set([
  'submit:public_sos',
  'submit:public_report',
]);

const ROLE_ALLOWLIST: Record<SecurityAction, OrgRole[]> = {
  'view:dashboard': ['Administrator', 'Approver', 'Operator', 'Analyst', 'Viewer'],
  'view:gis': ['Administrator', 'Approver', 'Operator', 'Analyst', 'Viewer'],
  'view:hazard_scores': ['Administrator', 'Approver', 'Operator', 'Analyst', 'Viewer'],
  'edit:scoring_weights': ['Administrator'],
  'approve:relocation_plan': ['Administrator', 'Approver'],
  'issue:cap_alert': ['Administrator', 'Approver', 'Operator'],
  'approve:red_alert': ['Administrator', 'Approver'],
  'manage:incidents': ['Administrator', 'Approver', 'Operator'],
  'verify:community_report': ['Administrator', 'Approver', 'Operator'],
  'manage:resources': ['Administrator', 'Approver', 'Operator'],
  'manage:relocation_cases': ['Administrator', 'Approver', 'Operator'],
  'reveal:sensitive_pii': ['Administrator', 'Approver', 'Operator'],
  'export:personal_data': ['Administrator', 'Approver'],
  'manage:datasets': ['Administrator', 'Approver', 'Operator', 'Analyst'],
  'manage:users_and_orgs': ['Administrator'],
  'submit:public_sos': ['Administrator', 'Approver', 'Operator', 'Analyst', 'Viewer'],
  'submit:public_report': ['Administrator', 'Approver', 'Operator', 'Analyst', 'Viewer'],
};

/**
 * Central deny-by-default authorisation engine (Section 4 & Section 8.5).
 * Enforces:
 * 1. Authentication presence (except public SOS / hazard reporting)
 * 2. Role permission matrix (Administrator, Approver, Operator, Analyst, Viewer)
 * 3. Inter-organisation sharing rules (e.g., Partners only access relief tasks; Citizen cannot access staff actions)
 * 4. Jurisdiction hierarchy (National > State > District > Block > Village)
 */
export function authorize(
  user: UserProfile | null | undefined,
  action: SecurityAction,
  resource?: ResourceContext
): AuthorizationDecision {
  // Public life-safety actions never require authentication
  if (PUBLIC_ACTIONS.has(action)) {
    return {
      allowed: true,
      status: 200,
      code: 'AUTHORIZED',
      message: 'Public safety action permitted.',
    };
  }

  if (!user || !user.id || !user.role) {
    return {
      allowed: false,
      status: 401,
      code: 'UNAUTHENTICATED',
      message: 'Authentication is required to perform this action.',
    };
  }

  // Citizen accounts are restricted from staff administration/mutation actions
  const isCitizen = user.organisation === 'citizen' || user.role === 'citizen' || user.role === 'villager';
  if (
    isCitizen &&
    action !== 'view:dashboard' &&
    action !== 'view:gis' &&
    action !== 'view:hazard_scores'
  ) {
    return {
      allowed: false,
      status: 403,
      code: 'FORBIDDEN_ORG',
      message: 'You do not have access to this record or operational action.',
    };
  }

  // Derive OrgRole fallback if legacy role is provided
  const effectiveOrgRole: OrgRole =
    user.orgRole ||
    (user.role === 'administrator' || user.role === 'sdma' || user.role === 'national_authority'
      ? 'Administrator'
      : user.role === 'district_officer'
      ? 'Approver'
      : user.role === 'field_officer' || user.role === 'response_team'
      ? 'Operator'
      : user.role === 'department_agency'
      ? 'Analyst'
      : 'Viewer');

  const allowedRoles = ROLE_ALLOWLIST[action];
  if (!allowedRoles || !allowedRoles.includes(effectiveOrgRole)) {
    return {
      allowed: false,
      status: 403,
      code: 'FORBIDDEN_ROLE',
      message: `Role '${effectiveOrgRole}' is not authorised for '${action}'.`,
    };
  }

  // Organisation-specific sharing rules
  if (user.organisation === 'partners') {
    const partnerPermitted: SecurityAction[] = [
      'view:dashboard',
      'view:gis',
      'view:hazard_scores',
      'manage:resources',
    ];
    if (!partnerPermitted.includes(action)) {
      return {
        allowed: false,
        status: 403,
        code: 'FORBIDDEN_ORG',
        message: 'Partner organisations may only access assigned relief and resource tasks.',
      };
    }
    if (resource?.resourceType && resource.resourceType !== 'relief_task' && resource.resourceType !== 'general') {
      return {
        allowed: false,
        status: 403,
        code: 'FORBIDDEN_ORG',
        message: 'Partner organisation scope is limited to requested relief tasks.',
      };
    }
  }

  // Jurisdiction hierarchy enforcement: National > State > District
  if (resource?.district && user.district && user.district !== 'All Districts') {
    const isNationalOrState =
      user.organisation === 'ndma' ||
      user.organisation === 'sdma' ||
      user.jurisdictionLevel === 'National' ||
      user.jurisdictionLevel === 'State';

    if (!isNationalOrState && user.district.toLowerCase() !== resource.district.toLowerCase()) {
      return {
        allowed: false,
        status: 403,
        code: 'FORBIDDEN_JURISDICTION',
        message: `Jurisdiction mismatch: your assignment (${user.district}) does not cover ${resource.district}.`,
      };
    }
  }

  return {
    allowed: true,
    status: 200,
    code: 'AUTHORIZED',
    message: 'Access granted.',
  };
}

/**
 * Masks sensitive personal data (phone numbers, household head names, exact coordinates)
 * by default unless explicitly revealed by an authorised role (Section 8.5).
 */
export function maskSensitiveField(
  value: string | null | undefined,
  fieldType: 'phone' | 'name' | 'coordinates',
  revealed = false
): string {
  if (!value) return '—';
  if (revealed) return value;

  if (fieldType === 'phone') {
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 4) {
      return `•••• ••${digits.slice(-4)}`;
    }
    return '•••• ••••';
  }

  if (fieldType === 'name') {
    const parts = value.trim().split(/\s+/);
    return parts
      .map((p) => (p.length > 1 ? `${p[0]}${'•'.repeat(Math.min(p.length - 1, 5))}` : p))
      .join(' ');
  }

  if (fieldType === 'coordinates') {
    const parts = value.split(',');
    if (parts.length === 2) {
      const latNum = Number(parts[0]);
      const lngNum = Number(parts[1]);
      if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
        return `${latNum.toFixed(2)}°N, ${lngNum.toFixed(2)}°E (masked)`;
      }
    }
    return 'Coordinates masked';
  }

  return value;
}
