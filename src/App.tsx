import React, { Suspense, lazy, useEffect, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { useAppStore } from './store/useAppStore';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { GlobalDomTranslator } from './components/GlobalDomTranslator';
import { AppErrorBoundary, RouteErrorBoundary } from './resilience/ErrorBoundaries';
import { initGlobalObservability, onChunkReloadPrompt } from './resilience/reporter';
import { LoadingSkeletonState } from './components/StateViews';
import { UserRole } from './types';

const SimplifiedMapPage = lazy(() =>
  import('./pages/SimplifiedMapPage').then((m) => ({ default: m.SimplifiedMapPage }))
);
const GisWorkspacePage = lazy(() =>
  import('./pages/GisWorkspacePage').then((m) => ({ default: m.GisWorkspacePage }))
);
const HazardMapPage = lazy(() =>
  import('./pages/HazardMapPage').then((m) => ({ default: m.HazardMapPage }))
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const VulnerabilityPage = lazy(() =>
  import('./pages/VulnerabilityPage').then((m) => ({ default: m.VulnerabilityPage }))
);
const PriorityRankingPage = lazy(() =>
  import('./pages/PriorityRankingPage').then((m) => ({ default: m.PriorityRankingPage }))
);
const RelocationSitesPage = lazy(() =>
  import('./pages/RelocationSitesPage').then((m) => ({ default: m.RelocationSitesPage }))
);
const SimplifiedPlanningPage = lazy(() =>
  import('./pages/SimplifiedPlanningPage').then((m) => ({
    default: m.SimplifiedPlanningPage,
  }))
);
const SimulatorPage = lazy(() =>
  import('./pages/SimulatorPage').then((m) => ({ default: m.SimulatorPage }))
);
const CommunityReportsPage = lazy(() =>
  import('./pages/CommunityReportsPage').then((m) => ({ default: m.CommunityReportsPage }))
);
const IncidentManagementPage = lazy(() =>
  import('./pages/IncidentManagementPage').then((m) => ({ default: m.IncidentManagementPage }))
);
const SimplifiedAlertsPage = lazy(() =>
  import('./pages/SimplifiedAlertsPage').then((m) => ({
    default: m.SimplifiedAlertsPage,
  }))
);
const EmergencySosPage = lazy(() =>
  import('./pages/EmergencySosPage').then((m) => ({
    default: m.EmergencySosPage,
  }))
);
const EvacuationPlanningPage = lazy(() =>
  import('./pages/EvacuationPlanningPage').then((m) => ({ default: m.EvacuationPlanningPage }))
);
const SimplifiedResourcesPage = lazy(() =>
  import('./pages/SimplifiedResourcesPage').then((m) => ({
    default: m.SimplifiedResourcesPage,
  }))
);
const ResourceManagementPage = lazy(() =>
  import('./pages/ResourceManagementPage').then((m) => ({ default: m.ResourceManagementPage }))
);
const RelocationTrackerPage = lazy(() =>
  import('./pages/RelocationTrackerPage').then((m) => ({ default: m.RelocationTrackerPage }))
);
const ImpactComparisonPage = lazy(() =>
  import('./pages/ImpactComparisonPage').then((m) => ({
    default: m.ImpactComparisonPage,
  }))
);
const AnalyticsReportsPage = lazy(() =>
  import('./pages/AnalyticsReportsPage').then((m) => ({ default: m.AnalyticsReportsPage }))
);
const IndiaDisasterHistoryPage = lazy(() =>
  import('./pages/IndiaDisasterHistoryPage').then((m) => ({ default: m.IndiaDisasterHistoryPage }))
);
const DataManagementPage = lazy(() =>
  import('./pages/DataManagementPage').then((m) => ({ default: m.DataManagementPage }))
);
const CitizenPortalPage = lazy(() =>
  import('./pages/CitizenPortalPage').then((m) => ({ default: m.CitizenPortalPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

const ALL_ROLES: UserRole[] = [
  'administrator',
  'district_officer',
  'field_officer',
  'response_team',
  'sdma',
  'national_authority',
  'department_agency',
  'partner_org',
  'citizen',
  'villager',
];

const STAFF_ROLES: UserRole[] = [
  'administrator',
  'district_officer',
  'field_officer',
  'response_team',
  'sdma',
  'national_authority',
  'department_agency',
  'partner_org',
];

const getDefaultRouteForRole = (role?: UserRole): string => {
  if (!role) return '/login';
  return '/map';
};

const AccessDeniedScreen: React.FC<{ fallbackRoute: string }> = ({ fallbackRoute }) => {
  const navigate = useNavigate();
  return (
    <div role="alert" className="p-8 max-w-xl mx-auto my-12">
      <div className="neu-raised p-6 space-y-4 border border-[var(--border)]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-[#B91C1C] text-white flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              You do not have access to this record
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              HTTP 403 · Your active role is not authorised for this module.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(fallbackRoute)}
            className="neu-btn-primary px-4 py-2 text-xs font-semibold"
          >
            Return to Map
          </button>
        </div>
      </div>
    </div>
  );
};

const RoleGuard: React.FC<{
  allowed: UserRole[];
  routeName?: string;
  children: React.ReactNode;
}> = ({ allowed, routeName, children }) => {
  const user = useAppStore((s) => s.user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  const normalizedRole = user.role === 'sdma' ? 'administrator' : user.role;
  if (!allowed.includes(normalizedRole) && !allowed.includes(user.role)) {
    return <AccessDeniedScreen fallbackRoute={getDefaultRouteForRole(user.role)} />;
  }
  return <RouteErrorBoundary routeName={routeName}>{children}</RouteErrorBoundary>;
};

export const App: React.FC = () => {
  const user = useAppStore((s) => s.user);
  const setOfflineSimulated = useAppStore((s) => s.setOfflineSimulated);
  const defaultRoute = getDefaultRouteForRole(user?.role);
  const [chunkNeedsReload, setChunkNeedsReload] = useState(false);

  useEffect(() => {
    initGlobalObservability();
    const handleBrowserOffline = () => setOfflineSimulated(true);
    const handleBrowserOnline = () => setOfflineSimulated(false);
    window.addEventListener('offline', handleBrowserOffline);
    window.addEventListener('online', handleBrowserOnline);
    const unsubChunk = onChunkReloadPrompt((needsReload) => {
      setChunkNeedsReload(needsReload);
    });
    return () => {
      window.removeEventListener('offline', handleBrowserOffline);
      window.removeEventListener('online', handleBrowserOnline);
      unsubChunk();
    };
  }, [setOfflineSimulated]);

  const baseUrl = (import.meta as unknown as { env?: { BASE_URL?: string } })?.env?.BASE_URL || '/';

  return (
    <AppErrorBoundary>
      <BrowserRouter basename={baseUrl}>
        <GlobalDomTranslator />

        {chunkNeedsReload && (
          <div
            role="status"
            className="fixed top-3 left-1/2 -translate-x-1/2 z-50 neu-raised px-4 py-2.5 border-2 border-[#0B8F80] flex items-center gap-3 text-xs font-semibold"
          >
            <span>A new version is available. Reload</span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="neu-btn-primary px-3 py-1 text-xs flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Reload</span>
            </button>
          </div>
        )}

        <Suspense
          fallback={
            <div className="p-8 max-w-4xl mx-auto">
              <LoadingSkeletonState rows={4} label="Loading workspace module..." />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Navigate to="/map" replace />} />
            <Route path="/login" element={<LoginPage />} />

            <Route
              element={user ? <AppLayout /> : <Navigate to="/login" replace />}
            >
              {/* 1. COMMAND CENTER & INTERACTIVE GIS MAP */}
              <Route
                path="/map"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="GIS Command Center">
                    <SimplifiedMapPage />
                  </RoleGuard>
                }
              />

              {/* 1.5. INDIA'S LAST 30 DAYS DISASTER HISTORY (NATIONWIDE) */}
              <Route
                path="/disaster-history"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="India Disaster History">
                    <IndiaDisasterHistoryPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/india-disaster-history"
                element={<Navigate to="/disaster-history" replace />}
              />

              {/* 2. GIS EXPLORER & DIGITAL TWIN */}
              <Route
                path="/gis"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="GIS Explorer">
                    <GisWorkspacePage />
                  </RoleGuard>
                }
              />
              <Route
                path="/digital-twin"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="3D Digital Twin">
                    <GisWorkspacePage />
                  </RoleGuard>
                }
              />

              {/* 3. HAZARD INTELLIGENCE */}
              <Route
                path="/hazard-map"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="Hazard Intelligence">
                    <HazardMapPage />
                  </RoleGuard>
                }
              />

              {/* 4. RED ZONE ANALYSIS DASHBOARD */}
              <Route
                path="/dashboard"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="Red Zone Analysis">
                    <DashboardPage />
                  </RoleGuard>
                }
              />

              {/* 5. VULNERABILITY & EXPOSURE ASSESSMENT */}
              <Route
                path="/vulnerability"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="Vulnerability Assessment">
                    <VulnerabilityPage />
                  </RoleGuard>
                }
              />

              {/* 6. RELOCATION PRIORITY ENGINE */}
              <Route
                path="/priority-ranking"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="Relocation Priority">
                    <PriorityRankingPage />
                  </RoleGuard>
                }
              />

              {/* 7. SAFE-ZONE SUITABILITY & CARRYING CAPACITY */}
              <Route
                path="/relocation-sites"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="Safe-Zone Capacity">
                    <RelocationSitesPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/site-suitability"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="Safe-Zone Suitability">
                    <RelocationSitesPage />
                  </RoleGuard>
                }
              />

              {/* 8. RELOCATION SITE PLANNER */}
              <Route
                path="/planning"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="Relocation Site Planner">
                    <SimplifiedPlanningPage />
                  </RoleGuard>
                }
              />

              {/* 10. WHAT-IF SCENARIO SIMULATOR */}
              <Route
                path="/simulator"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="Scenario Simulator">
                    <SimulatorPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/scenarios"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="Scenario Simulator">
                    <SimulatorPage />
                  </RoleGuard>
                }
              />

              {/* 11. INCIDENT REPORTS & COMMUNITY FIELD OBSERVATIONS */}
              <Route
                path="/community-reports"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="Community & Field Reports">
                    <CommunityReportsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/incidents"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="Incident Reports">
                    <IncidentManagementPage />
                  </RoleGuard>
                }
              />

              {/* 12. OFFICIAL ALERTS, LIVE VOICE ALERT & EMERGENCY SOS */}
              <Route
                path="/alerts"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="Official Alerts">
                    <SimplifiedAlertsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/early-warning"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="Early Warning">
                    <SimplifiedAlertsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/sos"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="Emergency SOS">
                    <EmergencySosPage />
                  </RoleGuard>
                }
              />

              {/* 13. EVACUATION ROUTES AND ROADS */}
              <Route
                path="/evacuation"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="Evacuation and Roads">
                    <EvacuationPlanningPage />
                  </RoleGuard>
                }
              />

              {/* 14 & 15. SHELTERS, IDRN RESOURCES & VOLUNTEER OPERATIONS */}
              <Route
                path="/resources"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="Shelters and Resources">
                    <SimplifiedResourcesPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/volunteers"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="Volunteer Operations">
                    <ResourceManagementPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/national-portals"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="National Portals">
                    <SimplifiedResourcesPage />
                  </RoleGuard>
                }
              />

              {/* 16. DIGITAL RELOCATION CASE TRACKING */}
              <Route
                path="/relocation-tracker"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="Relocation Case Tracking">
                    <RelocationTrackerPage />
                  </RoleGuard>
                }
              />

              {/* 17. REPORTS, IMPACT & ANALYTICS */}
              <Route
                path="/impact"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="Impact Assessment">
                    <ImpactComparisonPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/analytics"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="Reports and Analytics">
                    <AnalyticsReportsPage />
                  </RoleGuard>
                }
              />

              {/* 18. DATA SOURCES AND IMPORTS */}
              <Route
                path="/data-sources"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="Data Sources and Imports">
                    <DataManagementPage />
                  </RoleGuard>
                }
              />

              {/* CITIZEN PORTAL */}
              <Route
                path="/citizen-portal"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="Citizen Portal">
                    <CitizenPortalPage />
                  </RoleGuard>
                }
              />
              <Route path="/citizen" element={<Navigate to="/citizen-portal" replace />} />
              <Route path="/public" element={<Navigate to="/citizen-portal" replace />} />

              {/* 19. ADMINISTRATION AND AUDIT */}
              <Route
                path="/settings"
                element={
                  <RoleGuard allowed={ALL_ROLES} routeName="Administration and Audit">
                    <SettingsPage />
                  </RoleGuard>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to={defaultRoute} replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppErrorBoundary>
  );
};
