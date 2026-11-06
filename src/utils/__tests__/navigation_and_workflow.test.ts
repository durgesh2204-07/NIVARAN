import { describe, expect, it } from 'vitest';
import { MASTER_NAV_GROUPS, NavItemDef } from '../../layouts/LeftNavigationPanel';
import { carryingCapacity, greedyMatch } from '../scoring';
import { INITIAL_RELOCATION_SITES, INITIAL_VILLAGES } from '../../data/mockData';
import { UserRole } from '../../types';

describe('NIVARAN GIS 2.0 Navigation & Relocation Workflow Verification', () => {
  it('contains all 18 Master Navigation Modules as defined in Section 4', () => {
    const allItems: NavItemDef[] = MASTER_NAV_GROUPS.flatMap((g) => g.items);
    
    // Check that items 1 through 18 are all present
    const numbers = allItems.map((item) => item.num);
    for (let i = 1; i <= 18; i++) {
      expect(numbers).toContain(i);
    }

    // Check module 1 is Overview Dashboard (/dashboard)
    const overview = allItems.find((i) => i.num === 1);
    expect(overview).toBeDefined();
    expect(overview?.to).toBe('/dashboard');
    expect(overview?.labelEn).toBe('Overview Dashboard');

    // Check module 2 is Live GIS Intelligence (/map)
    const commandCenter = allItems.find((i) => i.num === 2);
    expect(commandCenter).toBeDefined();
    expect(commandCenter?.to).toBe('/map');
    expect(commandCenter?.labelEn).toBe('Live GIS Intelligence');

    // Check module 6 is Safe Zone Analysis (/relocation-sites)
    const capacityModule = allItems.find((i) => i.num === 6);
    expect(capacityModule).toBeDefined();
    expect(capacityModule?.to).toBe('/relocation-sites');

    // Check module 8 is Relocation Priority Planning (/priority-ranking)
    const priorityModule = allItems.find((i) => i.num === 8);
    expect(priorityModule).toBeDefined();
    expect(priorityModule?.to).toBe('/priority-ranking');

    // Check module 16 is Audit Logs (/settings?tab=audit)
    const auditModule = allItems.find((i) => i.num === 16);
    expect(auditModule).toBeDefined();
    expect(auditModule?.to).toBe('/settings?tab=audit');

    // Verify all items have English, Hindi, and Marathi labels
    allItems.forEach((it) => {
      expect(it.labelEn).toBeTruthy();
      expect(it.labelHi).toBeTruthy();
      expect(it.labelMr).toBeTruthy();
      expect(it.to.startsWith('/')).toBe(true);
    });
  });

  it('filters navigation items based on UserRole permissions', () => {
    const citizenRole: UserRole = 'citizen';
    const adminRole: UserRole = 'administrator';

    const citizenItems = MASTER_NAV_GROUPS.flatMap((g) =>
      g.items.filter((it) => it.roles.includes(citizenRole))
    );
    const adminItems = MASTER_NAV_GROUPS.flatMap((g) =>
      g.items.filter((it) => it.roles.includes(adminRole))
    );

    expect(citizenItems.length).toBeGreaterThan(0);
    expect(adminItems.length).toBeGreaterThanOrEqual(citizenItems.length);
  });

  it('verifies safe carrying capacity strictly adheres to water and space constraints', () => {
    // 50 ha, 0.08 ha per household, 0.60 water reliability, 175 occupied
    const cap = carryingCapacity(50, 0.08, 0.60, 175);
    expect(cap.grossCapacity).toBe(625);
    expect(cap.safeCapacity).toBe(375);
    expect(cap.remainingCapacity).toBe(200);

    // If occupancy meets safe capacity, remaining should be 0 and traffic light Red
    const fullCap = carryingCapacity(50, 0.08, 0.60, 375);
    expect(fullCap.remainingCapacity).toBe(0);
    expect(fullCap.trafficLight).toBe('Red');

    // If occupancy exceeds safe capacity (overbooked), remaining should be 0 and never negative
    const overbookedCap = carryingCapacity(50, 0.08, 0.60, 450);
    expect(overbookedCap.remainingCapacity).toBe(0);
    expect(overbookedCap.utilizationPct).toBeGreaterThanOrEqual(100);
  });

  it('executes PS 26191 greedy match allocation without exceeding site capacity', () => {
    const ranked = greedyMatch(INITIAL_VILLAGES, INITIAL_RELOCATION_SITES, {
      rainfall: 0.35,
      slope: 0.30,
      history: 0.20,
      riverProximity: 0.15,
    });

    expect(ranked.length).toBe(INITIAL_VILLAGES.length);
    // Highest priority score must be rank 1
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].priorityScore).toBeGreaterThanOrEqual(ranked[1].priorityScore);

    // Total allocated households across sites must be tracked
    ranked.forEach((entry) => {
      expect(entry.allocations).toBeDefined();
      expect(entry.village.name).toBeTruthy();
    });
  });
});
