import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  Navigation,
  Package,
  Phone,
  Plus,
  Search,
  Send,
  Shield,
  Truck,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useAccurateGps } from '../services/gpsService';
import { fetchEvacuationRoute } from '../services/externalApis';
import {
  ReliefCamp,
  ResourceStockItem,
  ShelterCheckInRecord,
  VolunteerSkill,
} from '../types';
import { getShelterStatusMeta } from '../utils/alertUtils';
import { NdmaPortalFeaturesHub } from '../components/NdmaPortalFeaturesHub';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const SimplifiedResourcesPage: React.FC = () => {
  const user = useAppStore((s) => s.user);
  const language = useAppStore((s) => s.language);
  const reliefCamps = useAppStore((s) => s.reliefCamps);
  const updateCampOccupancy = useAppStore((s) => s.updateCampOccupancy);
  const setCampOccupancyExact = useAppStore((s) => s.setCampOccupancyExact);
  const addShelterRecord = useAppStore((s) => s.addShelterRecord);
  const updateShelterFacilities = useAppStore((s) => s.updateShelterFacilities);
  const checkInShelterPeople = useAppStore((s) => s.checkInShelterPeople);
  const checkOutShelterRecord = useAppStore((s) => s.checkOutShelterRecord);
  const shelterCheckInRecords = useAppStore((s) => s.shelterCheckIns);
  const shelterOccupancyLogs = useAppStore((s) => s.shelterOccupancyLogs);

  const volunteers = useAppStore((s) => s.volunteers);
  const toggleVolunteerLocationOptIn = useAppStore((s) => s.toggleVolunteerLocationOptIn);
  const updateVolunteerStatus = useAppStore((s) => s.updateVolunteerStatus);
  const registerVolunteer = useAppStore((s) => s.registerVolunteer);
  const approveVolunteerRegistration = useAppStore((s) => s.approveVolunteerRegistration);
  const assignVolunteerTask = useAppStore((s) => s.assignVolunteerTask);
  const updateVolunteerTaskStatus = useAppStore((s) => s.updateVolunteerTaskStatus);

  const resourceStock = useAppStore((s) => s.resourceStock);
  const resourceRequests = useAppStore((s) => s.resourceRequests);
  const addResourceStockItem = useAppStore((s) => s.addResourceStockItem);
  const requestResourceStock = useAppStore((s) => s.requestResourceStock);
  const approveAndDispatchResourceRequest = useAppStore((s) => s.approveAndDispatchResourceRequest);

  const { gps } = useAccurateGps();

  const isCitizen = !user || user.role === 'citizen' || user.role === 'villager';
  const isOfficerOrAdmin =
    !!user &&
    [
      'administrator',
      'sdma',
      'national_authority',
      'district_officer',
      'field_officer',
      'response_team',
      'department_agency',
    ].includes(user.role);
  const isShelterOrVolunteer = !isCitizen;

  const [activeTab, setActiveTab] = useState<'shelters' | 'volunteers' | 'ndma_idrn'>('shelters');
  const [districtFilter, setDistrictFilter] = useState<string>('All');
  const [skillFilter, setSkillFilter] = useState<string>('All');
  const [volStatusFilter, setVolStatusFilter] = useState<string>('All');
  const [moreOpen, setMoreOpen] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  // --- SHELTER FORMS STATE ---
  const [showAddShelterForm, setShowAddShelterForm] = useState(false);
  const [newShelterName, setNewShelterName] = useState('');
  const [newShelterDistrict, setNewShelterDistrict] = useState<ReliefCamp['district']>('Raigad');
  const [newShelterTaluka, setNewShelterTaluka] = useState('Mahad');
  const [newShelterCapacity, setNewShelterCapacity] = useState(200);
  const [newShelterPhone, setNewShelterPhone] = useState('+91 2145 222999');
  const [newShelterManager, setNewShelterManager] = useState('Camp Officer');

  const [checkInCampId, setCheckInCampId] = useState<string>(reliefCamps[0]?.id || 'camp-1');
  const [checkInName, setCheckInName] = useState('');
  const [checkInCount, setCheckInCount] = useState<number>(10);
  const [checkInAgeGroup, setCheckInAgeGroup] = useState<ShelterCheckInRecord['ageGroup']>(
    'Adult (15-59)'
  );
  const [checkInNeeds, setCheckInNeeds] = useState<ShelterCheckInRecord['specialNeeds']>('None');

  const [directionsResult, setDirectionsResult] = useState<{
    campId: string;
    distanceKm: number;
    durationMinutes: number;
    source: string;
  } | null>(null);

  // --- VOLUNTEER FORMS STATE ---
  const [showVolRegForm, setShowVolRegForm] = useState(false);
  const [volName, setVolName] = useState('');
  const [volPhone, setVolPhone] = useState('+91 98220 ');
  const [volDistrict, setVolDistrict] = useState('Raigad');
  const [volAvailability, setVolAvailability] = useState('24x7 Immediate Deployment');
  const [volSkills, setVolSkills] = useState<VolunteerSkill[]>(['rescue', 'medical']);
  const [volConsentGps, setVolConsentGps] = useState(true);

  const [taskTargetVolId, setTaskTargetVolId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskLocation, setTaskLocation] = useState('Mahad Flood Relief Sector 2');

  // --- IDRN RESOURCE INVENTORY STATE ---
  const [resSearch, setResSearch] = useState('');
  const [showAddResourceForm, setShowAddResourceForm] = useState(false);
  const [newResItemName, setNewResItemName] = useState('Inflatable Rescue Boats (OBM)');
  const [newResCategory, setNewResCategory] =
    useState<ResourceStockItem['category']>('Rescue Boats');
  const [newResDistrict, setNewResDistrict] = useState('Raigad');
  const [newResLocation, setNewResLocation] = useState('Mahad Sub-Division Yard');
  const [newResQty, setNewResQty] = useState(6);
  const [newResUnit, setNewResUnit] = useState('boats');
  const [newResPhone, setNewResPhone] = useState('+91 2145 222108');

  const [reqResourceId, setReqResourceId] = useState<string>(resourceStock[0]?.id || 'res-1');
  const [reqQty, setReqQty] = useState<number>(2);
  const [reqDestination, setReqDestination] = useState('Poladpur Landslide Zone');

  const filteredShelters = useMemo(() => {
    return reliefCamps.filter(
      (c) => districtFilter === 'All' || c.district === districtFilter
    );
  }, [reliefCamps, districtFilter]);

  const nearestAvailableShelter = useMemo(() => {
    const available = reliefCamps.filter((c) => c.currentOccupancy < c.capacityPersons);
    if (available.length === 0) return null;
    let best = available[0];
    let bestDist = haversineKm(gps.lat, gps.lng, best.lat, best.lng);
    for (const c of available.slice(1)) {
      const d = haversineKm(gps.lat, gps.lng, c.lat, c.lng);
      if (d < bestDist) {
        best = c;
        bestDist = d;
      }
    }
    return { camp: best, distanceKm: Number(bestDist.toFixed(1)) };
  }, [reliefCamps, gps.lat, gps.lng]);

  const filteredVolunteers = useMemo(() => {
    return volunteers.filter((v) => {
      const matchDist = districtFilter === 'All' || v.district === districtFilter;
      const matchSkill =
        skillFilter === 'All' || v.skills.includes(skillFilter as VolunteerSkill);
      const matchStatus = volStatusFilter === 'All' || v.status === volStatusFilter;
      return matchDist && matchSkill && matchStatus;
    });
  }, [volunteers, districtFilter, skillFilter, volStatusFilter]);

  const filteredResources = useMemo(() => {
    return resourceStock.filter((r) => {
      const matchDist = districtFilter === 'All' || r.district === districtFilter;
      const q = resSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.warehouseLocation.toLowerCase().includes(q) ||
        r.district.toLowerCase().includes(q);
      return matchDist && matchSearch;
    });
  }, [resourceStock, districtFilter, resSearch]);

  const handleGetDirections = async (camp: ReliefCamp) => {
    const res = await fetchEvacuationRoute(gps.lat, gps.lng, camp.lat, camp.lng);
    setDirectionsResult({
      campId: camp.id,
      distanceKm: res.distanceKm,
      durationMinutes: res.durationMinutes,
      source: res.source !== 'direct-corridor' ? 'OSRM Road Route' : 'Straight-line fallback',
    });
    showToast(`OSRM Route to ${camp.name}: ${res.distanceKm} km (~${res.durationMinutes} min)`);
  };

  const handleCreateShelter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShelterName.trim()) return;
    addShelterRecord({
      name: newShelterName.trim(),
      district: newShelterDistrict,
      taluka: newShelterTaluka.trim() || newShelterDistrict,
      lat: Number((gps.lat + (Math.random() - 0.5) * 0.03).toFixed(4)),
      lng: Number((gps.lng + (Math.random() - 0.5) * 0.03).toFixed(4)),
      capacityPersons: Math.max(10, Number(newShelterCapacity) || 100),
      shelterType: 'relief camp',
      facilities: {
        drinkingWater: true,
        medicalDesk: true,
        sanitationToilets: true,
        generatorPower: true,
        communityKitchen: true,
      },
      inChargeName: newShelterManager.trim() || 'Camp Manager',
      contactPhone: newShelterPhone.trim() || '1077',
    });
    setNewShelterName('');
    setShowAddShelterForm(false);
    showToast('New Relief Shelter created and synced live to Map & IndexedDB.');
  };

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInName.trim()) return;
    const targetCampId = checkInCampId || reliefCamps[0]?.id;
    if (!targetCampId) return;
    checkInShelterPeople({
      campId: targetCampId,
      personName: checkInName.trim(),
      headcount: Math.max(1, Number(checkInCount) || 1),
      ageGroup: checkInAgeGroup,
      specialNeeds: checkInNeeds,
    });
    setCheckInName('');
    showToast(
      `Checked in ${checkInCount} person(s) into shelter. Occupancy & Map status updated live.`
    );
  };

  const handleVolunteerRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!volName.trim()) return;
    registerVolunteer({
      name: volName.trim(),
      phone: volPhone.trim() || '+91 98000 00000',
      district: volDistrict,
      availability: volAvailability.trim() || 'Immediate',
      skills: volSkills.length > 0 ? volSkills : ['rescue'],
      lat: gps.lat,
      lng: gps.lng,
      optedInLocationSharing: volConsentGps,
    });
    setVolName('');
    setShowVolRegForm(false);
    showToast('Volunteer registration submitted (Status: Pending Officer Approval).');
  };

  const toggleSkillChoice = (sk: VolunteerSkill) => {
    setVolSkills((prev) =>
      prev.includes(sk) ? prev.filter((item) => item !== sk) : [...prev, sk]
    );
  };

  const handleAssignTaskSubmit = (volId: string) => {
    if (!taskTitle.trim()) return;
    assignVolunteerTask(volId, taskTitle.trim(), taskLocation.trim() || 'Field Sector');
    setTaskTargetVolId(null);
    setTaskTitle('');
    showToast('Task assigned to volunteer and logged to Audit Trail.');
  };

  const handleAddResourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResItemName.trim()) return;
    addResourceStockItem({
      itemName: newResItemName.trim(),
      category: newResCategory,
      district: newResDistrict,
      depotLocation: newResLocation.trim() || `${newResDistrict} HQ`,
      availableQty: Math.max(1, Number(newResQty) || 1),
      unit: newResUnit.trim() || 'units',
      custodianPhone: newResPhone.trim() || '1077',
    });
    setShowAddResourceForm(false);
    showToast('IDRN Equipment resource registered in inventory.');
  };

  const handleRequestResourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqDestination.trim()) return;
    const stockId = reqResourceId || resourceStock[0]?.id;
    if (!stockId) return;
    requestResourceStock({
      stockId,
      quantityRequested: Math.max(1, Number(reqQty) || 1),
      destination: reqDestination.trim(),
    });
    showToast('Resource dispatch request submitted for Officer Approval.');
  };

  return (
    <div className="space-y-4">
      {feedbackToast && (
        <div className="neu-raised p-3 rounded-[10px] border-l-4 border-[#15803D] bg-emerald-950/20 flex items-center justify-between text-xs font-bold text-[#15803D]">
          <span>{feedbackToast}</span>
          <button
            type="button"
            onClick={() => setFeedbackToast(null)}
            className="underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header & Toggle (Shelters | Volunteers | IDRN Resource Inventory) */}
      <div className="neu-raised p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">
            {language === 'hi'
              ? 'संसाधन: आश्रय, स्वयंसेवक और IDRN इन्वेंटरी (Resources)'
              : 'Resources: Shelters, Volunteers & IDRN Inventory'}
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Full Shelter Check-In Register, Aapda Mitra Volunteer Task Dispatch & IDRN Equipment Inventory
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="neu-input px-3 py-1.5 text-xs font-semibold"
          >
            <option value="All">All Districts</option>
            <option value="Raigad">Raigad</option>
            <option value="Satara">Satara</option>
            <option value="Pune">Pune</option>
            <option value="Ratnagiri">Ratnagiri</option>
            <option value="Kolhapur">Kolhapur</option>
            <option value="Sindhudurg">Sindhudurg</option>
          </select>

          <div className="neu-inset p-1 rounded-[10px] flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('shelters')}
              className={`px-3.5 py-1.5 rounded-[8px] font-bold flex items-center gap-1.5 ${
                activeTab === 'shelters'
                  ? 'bg-[#0B8F80] text-white'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Shelters ({filteredShelters.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('volunteers')}
              className={`px-3.5 py-1.5 rounded-[8px] font-bold flex items-center gap-1.5 ${
                activeTab === 'volunteers'
                  ? 'bg-[#0B8F80] text-white'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              <Users className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Volunteers ({filteredVolunteers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ndma_idrn')}
              className={`px-3.5 py-1.5 rounded-[8px] font-bold flex items-center gap-1.5 ${
                activeTab === 'ndma_idrn'
                  ? 'bg-[#0B8F80] text-white'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              <Package className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>IDRN Inventory ({filteredResources.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION A: SHELTERS & RELIEF CAMPS (FULL CRUD + CHECK-IN/OUT REGISTER + NEAREST SHELTER) */}
      {activeTab === 'shelters' && (
        <div className="space-y-4">
          {/* Nearest-shelter lookup banner for citizens & responders */}
          {nearestAvailableShelter && (
            <div className="neu-raised p-3.5 border-l-4 border-[#0B8F80] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-[#0B8F80]" strokeWidth={1.75} />
                  <span>
                    Nearest Available Shelter to your GPS ({gps.lat.toFixed(4)}°N, {gps.lng.toFixed(4)}°E):{' '}
                    <span className="text-[#0B8F80]">{nearestAvailableShelter.camp.name}</span>
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  {nearestAvailableShelter.camp.district} · {nearestAvailableShelter.distanceKm} km away ·{' '}
                  {nearestAvailableShelter.camp.capacityPersons -
                    nearestAvailableShelter.camp.currentOccupancy}{' '}
                  free beds available · Contact: {nearestAvailableShelter.camp.contactPhone}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleGetDirections(nearestAvailableShelter.camp)}
                  className="px-3 py-1.5 rounded-[8px] bg-[#0B8F80] text-white font-bold flex items-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>OSRM Route to Nearest Shelter</span>
                </button>
                {!isCitizen && (
                  <button
                    type="button"
                    onClick={() => setShowAddShelterForm((v) => !v)}
                    className="neu-btn px-3 py-1.5 font-bold flex items-center gap-1 text-[var(--text-primary)]"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#0B8F80]" strokeWidth={2} />
                    <span>{showAddShelterForm ? 'Close Form' : '+ Add New Shelter'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Add New Shelter Form (Shelter Manager / Officer) */}
          {showAddShelterForm && !isCitizen && (
            <form
              onSubmit={handleCreateShelter}
              className="neu-raised p-4 space-y-3 border border-[#0B8F80]/40 text-xs"
            >
              <div className="font-bold text-sm text-[var(--text-primary)]">
                Create New Relief Camp / Shelter
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                <input
                  type="text"
                  required
                  placeholder="Shelter Name (e.g., ZP School Birwadi)"
                  value={newShelterName}
                  onChange={(e) => setNewShelterName(e.target.value)}
                  className="neu-input px-3 py-2 sm:col-span-2"
                />
                <select
                  value={newShelterDistrict}
                  onChange={(e) =>
                    setNewShelterDistrict(e.target.value as ReliefCamp['district'])
                  }
                  className="neu-input px-3 py-2"
                >
                  <option value="Raigad">Raigad</option>
                  <option value="Satara">Satara</option>
                  <option value="Pune">Pune</option>
                  <option value="Ratnagiri">Ratnagiri</option>
                  <option value="Kolhapur">Kolhapur</option>
                  <option value="Sindhudurg">Sindhudurg</option>
                </select>
                <input
                  type="text"
                  placeholder="Taluka / Manager"
                  value={newShelterManager}
                  onChange={(e) => setNewShelterManager(e.target.value)}
                  className="neu-input px-3 py-2"
                />
                <input
                  type="number"
                  min={20}
                  max={5000}
                  placeholder="Capacity"
                  value={newShelterCapacity}
                  onChange={(e) => setNewShelterCapacity(Number(e.target.value))}
                  className="neu-input px-3 py-2 font-mono"
                />
                <input
                  type="text"
                  placeholder="Contact Phone"
                  value={newShelterPhone}
                  onChange={(e) => setNewShelterPhone(e.target.value)}
                  className="neu-input px-3 py-2 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddShelterForm(false)}
                  className="neu-btn px-3 py-1.5 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[8px] bg-[#0B8F80] text-white font-bold"
                >
                  Save Shelter
                </button>
              </div>
            </form>
          )}

          {/* SHELTER CHECK-IN & CHECK-OUT REGISTER (Section 3.5 & Acceptance Test #5) */}
          {!isCitizen && (
            <div className="neu-raised p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-[#0B8F80]" strokeWidth={1.75} />
                  <span>
                    Shelter Evacuee Check-In & Check-Out Register (Auto-updates Occupancy & Map Status)
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                  Active Registered Groups:{' '}
                  {shelterCheckInRecords.filter((r) => r.status === 'Checked-In').length}
                </span>
              </div>

              <form
                onSubmit={handleCheckInSubmit}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs items-end"
              >
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                    Select Shelter
                  </label>
                  <select
                    value={checkInCampId}
                    onChange={(e) => setCheckInCampId(e.target.value)}
                    className="neu-input w-full px-2.5 py-2 font-semibold"
                  >
                    {reliefCamps.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.currentOccupancy}/{c.capacityPersons})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                    Person / Family Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Shinde Family"
                    value={checkInName}
                    onChange={(e) => setCheckInName(e.target.value)}
                    className="neu-input w-full px-2.5 py-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                    People Count (e.g. 10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    required
                    value={checkInCount}
                    onChange={(e) => setCheckInCount(Number(e.target.value))}
                    className="neu-input w-full px-2.5 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                    Age Group
                  </label>
                  <select
                    value={checkInAgeGroup}
                    onChange={(e) =>
                      setCheckInAgeGroup(e.target.value as ShelterCheckInRecord['ageGroup'])
                    }
                    className="neu-input w-full px-2.5 py-2"
                  >
                    <option value="Adult (15-59)">Adult (15-59)</option>
                    <option value="Elderly (60+)">Elderly (60+)</option>
                    <option value="Child (0-14)">Child (0-14)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                    Special Needs
                  </label>
                  <select
                    value={checkInNeeds}
                    onChange={(e) =>
                      setCheckInNeeds(e.target.value as ShelterCheckInRecord['specialNeeds'])
                    }
                    className="neu-input w-full px-2.5 py-2"
                  >
                    <option value="None">None</option>
                    <option value="Medical">Medical</option>
                    <option value="Disabled">Disabled</option>
                    <option value="Pregnant / Lactating">Pregnant / Lactating</option>
                    <option value="Infant">Infant</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-[8px] bg-[#0B8F80] text-white font-bold flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Check-In ({checkInCount})</span>
                </button>
              </form>

              {/* Register Table */}
              <div className="space-y-1.5 pt-2 max-h-52 overflow-y-auto">
                {shelterCheckInRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="neu-flat px-3 py-2 rounded-[8px] flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-[var(--text-primary)]">{rec.personName}</span>{' '}
                      <span className="px-2 py-0.5 rounded bg-[#0B8F80]/15 text-[#0B8F80] font-mono font-bold">
                        {rec.headcount} person(s)
                      </span>{' '}
                      <span className="text-[var(--text-secondary)]">
                        · {rec.campName} · {rec.ageGroup} · Needs: {rec.specialNeeds}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                        In: {rec.checkedInAt}
                      </span>
                      {rec.status === 'Checked-Out' ? (
                        <span className="px-2 py-0.5 rounded bg-slate-500/20 text-[var(--text-secondary)] font-mono text-[11px]">
                          Checked Out ({rec.checkedOutAt})
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            checkOutShelterRecord(rec.id);
                            showToast(
                              `Checked out ${rec.personName} (${rec.headcount} persons) from ${rec.campName}.`
                            );
                          }}
                          className="neu-btn px-2.5 py-1 text-[11px] font-bold text-[#DC2626]"
                        >
                          Check Out (-{rec.headcount})
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shelter Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredShelters.map((camp) => {
              const meta = getShelterStatusMeta(camp);
              const dir =
                directionsResult?.campId === camp.id ? directionsResult : null;

              return (
                <div
                  key={camp.id}
                  className="neu-raised p-4 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="px-2.5 py-0.5 rounded text-xs font-bold text-white"
                        style={{ backgroundColor: meta.colorHex }}
                      >
                        {meta.statusText} ({meta.pct}% full)
                      </span>
                      <span className="px-2 py-0.5 rounded neu-flat text-[11px] font-semibold capitalize">
                        {camp.shelterType || 'relief camp'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">
                        {camp.name}
                      </h3>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {camp.district} · {camp.taluka} · Manager: {camp.inChargeName}
                      </div>
                    </div>

                    {/* Free beds & Occupancy Bar */}
                    <div className="neu-flat p-2.5 rounded-[10px] space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-secondary)]">Free beds:</span>
                        <span className="font-mono font-bold text-[#15803D]">
                          {meta.freeBeds} free (Capacity: {camp.capacityPersons}, Occupied:{' '}
                          {camp.currentOccupancy})
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-200"
                          style={{
                            width: `${Math.min(100, meta.pct)}%`,
                            backgroundColor: meta.colorHex,
                          }}
                        />
                      </div>
                    </div>

                    {/* Facilities Status (Interactive toggles for Shelter Managers / Officers) */}
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-[var(--text-secondary)]">
                      <button
                        type="button"
                        disabled={isCitizen}
                        onClick={() =>
                          updateShelterFacilities(camp.id, {
                            ...camp.facilities,
                            drinkingWater: !camp.facilities.drinkingWater,
                          })
                        }
                        className="text-left hover:underline"
                      >
                        Water:{' '}
                        <strong className="text-[var(--text-primary)]">
                          {camp.facilities.drinkingWater ? 'Yes' : 'No'}
                        </strong>
                      </button>
                      <button
                        type="button"
                        disabled={isCitizen}
                        onClick={() =>
                          updateShelterFacilities(camp.id, {
                            ...camp.facilities,
                            communityKitchen: !camp.facilities.communityKitchen,
                          })
                        }
                        className="text-left hover:underline"
                      >
                        Food:{' '}
                        <strong className="text-[var(--text-primary)]">
                          {camp.facilities.communityKitchen ? 'Yes' : 'No'}
                        </strong>
                      </button>
                      <button
                        type="button"
                        disabled={isCitizen}
                        onClick={() =>
                          updateShelterFacilities(camp.id, {
                            ...camp.facilities,
                            medicalDesk: !camp.facilities.medicalDesk,
                          })
                        }
                        className="text-left hover:underline"
                      >
                        Medical:{' '}
                        <strong className="text-[var(--text-primary)]">
                          {camp.facilities.medicalDesk ? 'Yes' : 'No'}
                        </strong>
                      </button>
                      <button
                        type="button"
                        disabled={isCitizen}
                        onClick={() =>
                          updateShelterFacilities(camp.id, {
                            ...camp.facilities,
                            generatorPower: !camp.facilities.generatorPower,
                          })
                        }
                        className="text-left hover:underline"
                      >
                        Power:{' '}
                        <strong className="text-[var(--text-primary)]">
                          {camp.facilities.generatorPower ? 'Yes' : 'No'}
                        </strong>
                      </button>
                      <div>
                        Toilets:{' '}
                        <strong className="text-[var(--text-primary)]">
                          {camp.facilities.sanitationToilets ? 'Yes' : 'No'}
                        </strong>
                      </div>
                      <div>
                        Women/Child/Disabled:{' '}
                        <strong className="text-[var(--text-primary)]">Safe Zone</strong>
                      </div>
                    </div>
                  </div>

                  {/* Directions Result if requested */}
                  {dir && (
                    <div className="neu-flat p-2.5 rounded-[8px] text-xs font-mono text-[#0B8F80] font-bold">
                      Route from your GPS: {dir.distanceKm} km · ~{dir.durationMinutes} mins ({dir.source})
                    </div>
                  )}

                  {/* Shelter Manager Occupancy Editor (Officers/Managers only) */}
                  {isShelterOrVolunteer && (
                    <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-2 text-xs">
                      <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                        Quick Check-In/Out:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateCampOccupancy(camp.id, -10)}
                          className="neu-btn px-2 py-1 font-mono font-bold"
                        >
                          -10
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={camp.capacityPersons}
                          value={camp.currentOccupancy}
                          onChange={(e) =>
                            setCampOccupancyExact(camp.id, Number(e.target.value))
                          }
                          className="neu-input w-16 px-1.5 py-1 text-center font-mono font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => updateCampOccupancy(camp.id, 10)}
                          className="neu-btn px-2 py-1 font-mono font-bold text-[#0B8F80]"
                        >
                          +10
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Footer: Contact & Get Directions */}
                  <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-2">
                    <a
                      href={`tel:${camp.contactPhone}`}
                      className="text-xs font-mono font-bold text-[var(--text-primary)] hover:text-[#0B8F80] flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#0B8F80]" strokeWidth={1.75} />
                      <span>{camp.contactPhone}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => void handleGetDirections(camp)}
                      className="neu-btn px-3 py-1.5 text-xs font-bold text-[#0B8F80] flex items-center gap-1"
                    >
                      <Navigation className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>Get directions</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shelter Occupancy Change Log */}
          <div className="neu-raised p-4 space-y-2.5">
            <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#0B8F80]" strokeWidth={1.75} />
              <span>Shelter Occupancy Change Log (Who changed occupancy and when)</span>
            </div>
            <div className="space-y-1.5 text-xs">
              {shelterOccupancyLogs.slice(0, 6).map((log) => (
                <div
                  key={log.id}
                  className="neu-flat px-3 py-2 rounded-[8px] flex flex-wrap items-center justify-between gap-2"
                >
                  <span>
                    <strong>{log.campName}</strong>: Occupancy changed from{' '}
                    <span className="font-mono font-bold">{log.previousOccupancy}</span> to{' '}
                    <span className="font-mono font-bold text-[#0B8F80]">{log.newOccupancy}</span>
                  </span>
                  <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                    By {log.changedBy} · {log.changedAt}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION B: VOLUNTEERS (REGISTRATION, OFFICER APPROVAL, TASK ASSIGNMENT & ACCEPT/DECLINE) */}
      {activeTab === 'volunteers' && (
        <div className="space-y-4">
          {/* Privacy Notice + Filters + Register Button */}
          <div className="neu-raised p-3.5 border-l-4 border-[#0B8F80] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#0B8F80] shrink-0" strokeWidth={1.75} />
              <span>
                <strong>Volunteer Privacy & Consent:</strong> Live GPS locations are shared{' '}
                <u>only with authorised roles</u> and <u>only for opted-in volunteers</u>.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className="neu-input px-2.5 py-1 text-xs"
              >
                <option value="All">All Skills</option>
                <option value="medical">Medical</option>
                <option value="rescue">Rescue</option>
                <option value="boat">Boat</option>
                <option value="driver">Driver</option>
                <option value="food">Food</option>
              </select>

              <select
                value={volStatusFilter}
                onChange={(e) => setVolStatusFilter(e.target.value)}
                className="neu-input px-2.5 py-1 text-xs"
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Busy">Busy</option>
                <option value="Offline">Offline</option>
              </select>

              <button
                type="button"
                onClick={() => setShowVolRegForm((v) => !v)}
                className="px-3 py-1.5 rounded-[8px] bg-[#0B8F80] text-white font-bold flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>{showVolRegForm ? 'Close Form' : '+ Register as Volunteer'}</span>
              </button>
            </div>
          </div>

          {/* Volunteer Registration Form (Aapda Mitra / NSS / NYKS) */}
          {showVolRegForm && (
            <form
              onSubmit={handleVolunteerRegister}
              className="neu-raised p-4 space-y-3 border border-[#0B8F80]/40 text-xs"
            >
              <div className="font-bold text-sm text-[var(--text-primary)]">
                Aapda Mitra / NSS / NYKS Volunteer Registration (Requires Officer Approval)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={volName}
                  onChange={(e) => setVolName(e.target.value)}
                  className="neu-input px-3 py-2"
                />
                <input
                  type="text"
                  required
                  placeholder="Phone (+91...)"
                  value={volPhone}
                  onChange={(e) => setVolPhone(e.target.value)}
                  className="neu-input px-3 py-2 font-mono"
                />
                <select
                  value={volDistrict}
                  onChange={(e) => setVolDistrict(e.target.value)}
                  className="neu-input px-3 py-2"
                >
                  <option value="Raigad">Raigad</option>
                  <option value="Satara">Satara</option>
                  <option value="Pune">Pune</option>
                  <option value="Ratnagiri">Ratnagiri</option>
                  <option value="Kolhapur">Kolhapur</option>
                  <option value="Sindhudurg">Sindhudurg</option>
                </select>
                <input
                  type="text"
                  placeholder="Availability (e.g., 24x7 / Weekends)"
                  value={volAvailability}
                  onChange={(e) => setVolAvailability(e.target.value)}
                  className="neu-input px-3 py-2"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[var(--text-secondary)]">Select Skills:</span>
                  {(['rescue', 'medical', 'boat', 'driver', 'food'] as VolunteerSkill[]).map(
                    (sk) => (
                      <button
                        key={sk}
                        type="button"
                        onClick={() => toggleSkillChoice(sk)}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase ${
                          volSkills.includes(sk)
                            ? 'bg-[#0B8F80] text-white'
                            : 'neu-flat text-[var(--text-secondary)]'
                        }`}
                      >
                        {sk}
                      </button>
                    )
                  )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={volConsentGps}
                    onChange={(e) => setVolConsentGps(e.target.checked)}
                    className="rounded"
                  />
                  <span>I consent to share my live GPS location with authorised emergency officers</span>
                </label>

                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[8px] bg-[#0B8F80] text-white font-bold"
                >
                  Submit Registration
                </button>
              </div>
            </form>
          )}

          {/* Volunteer Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredVolunteers.map((vol) => {
              const approval = vol.approvalStatus || 'Approved';
              return (
                <div
                  key={vol.id}
                  className="neu-raised p-4 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-bold text-white ${
                            vol.status === 'Available'
                              ? 'bg-[#15803D]'
                              : vol.status === 'Busy'
                              ? 'bg-[#CA8A04]'
                              : 'bg-[#475569]'
                          }`}
                        >
                          {vol.status}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            approval === 'Approved'
                              ? 'bg-emerald-500/15 text-[#15803D]'
                              : approval === 'Pending Approval'
                              ? 'bg-amber-500/20 text-[#CA8A04]'
                              : 'bg-red-500/20 text-[#DC2626]'
                          }`}
                        >
                          {approval}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                        {vol.lastSeen}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">{vol.name}</h3>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {vol.unitName || 'Aapda Mitra Volunteer'} · {vol.district}
                      </div>
                    </div>

                    {/* Skills chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {vol.skills.map((sk) => (
                        <span
                          key={sk}
                          className="px-2 py-0.5 rounded neu-flat text-[11px] font-mono font-bold uppercase text-[#0B8F80]"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>

                    {/* Officer Approval Controls for Pending Volunteers */}
                    {isOfficerOrAdmin && approval === 'Pending Approval' && (
                      <div className="neu-flat p-2.5 rounded-[8px] flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-[#CA8A04]">
                          Awaiting Officer Approval:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              approveVolunteerRegistration(vol.id, true);
                              showToast(`Volunteer ${vol.name} approved.`);
                            }}
                            className="px-2.5 py-1 rounded bg-[#15803D] text-white font-bold text-[11px]"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              approveVolunteerRegistration(vol.id, false);
                              showToast(`Volunteer ${vol.name} rejected.`);
                            }}
                            className="px-2.5 py-1 rounded bg-[#DC2626] text-white font-bold text-[11px]"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Assigned Task Workflow Card (Section 3.6 & Acceptance Test #6) */}
                    {vol.assignedTask ? (
                      <div className="neu-inset p-2.5 rounded-[8px] space-y-2 text-xs border-l-2 border-[#0B8F80]">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-[var(--text-primary)]">
                            Task: {vol.assignedTask.title}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#0B8F80] text-white font-mono text-[10px] font-bold">
                            {vol.assignedTask.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)]">
                          Location: {vol.assignedTask.location} · By {vol.assignedTask.assignedBy}
                        </div>

                        {/* Volunteer Task Action Buttons: Accept / Decline / In progress / Done */}
                        {!isCitizen && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {vol.assignedTask.status === 'Assigned' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateVolunteerTaskStatus(vol.id, 'Accepted');
                                    showToast(`${vol.name} accepted task: ${vol.assignedTask?.title}`);
                                  }}
                                  className="px-2.5 py-1 rounded bg-[#15803D] text-white font-bold text-[11px]"
                                >
                                  Accept Task
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateVolunteerTaskStatus(vol.id, 'Declined');
                                    showToast(`${vol.name} declined task.`);
                                  }}
                                  className="px-2.5 py-1 rounded bg-[#DC2626] text-white font-bold text-[11px]"
                                >
                                  Decline
                                </button>
                              </>
                            )}
                            {vol.assignedTask.status === 'Accepted' && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateVolunteerTaskStatus(vol.id, 'In progress');
                                  showToast(`${vol.name} marked task In Progress.`);
                                }}
                                className="px-2.5 py-1 rounded bg-[#CA8A04] text-white font-bold text-[11px]"
                              >
                                Start (In Progress)
                              </button>
                            )}
                            {(vol.assignedTask.status === 'Accepted' ||
                              vol.assignedTask.status === 'In progress') && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateVolunteerTaskStatus(vol.id, 'Done');
                                  showToast(`${vol.name} completed task!`);
                                }}
                                className="px-2.5 py-1 rounded bg-[#0B8F80] text-white font-bold text-[11px]"
                              >
                                Mark Done
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      isOfficerOrAdmin &&
                      approval === 'Approved' && (
                        <div>
                          {taskTargetVolId === vol.id ? (
                            <div className="neu-flat p-2.5 rounded-[8px] space-y-2 text-xs">
                              <input
                                type="text"
                                placeholder="Task description (e.g., Boat Evacuation at Mahad)"
                                value={taskTitle}
                                onChange={(e) => setTaskTitle(e.target.value)}
                                className="neu-input w-full px-2.5 py-1.5"
                              />
                              <input
                                type="text"
                                placeholder="Target Sector / Village"
                                value={taskLocation}
                                onChange={(e) => setTaskLocation(e.target.value)}
                                className="neu-input w-full px-2.5 py-1.5"
                              />
                              <div className="flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setTaskTargetVolId(null)}
                                  className="neu-btn px-2 py-1 text-[11px]"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAssignTaskSubmit(vol.id)}
                                  className="px-2.5 py-1 rounded bg-[#0B8F80] text-white font-bold text-[11px] flex items-center gap-1"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Assign Task</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setTaskTargetVolId(vol.id);
                                setTaskTitle(`Field Rescue Support (${vol.district})`);
                                setTaskLocation(`${vol.district} Flood Sector`);
                              }}
                              className="neu-btn w-full py-1.5 text-xs font-bold text-[#0B8F80] flex items-center justify-center gap-1.5"
                            >
                              <UserCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
                              <span>Assign Task Request</span>
                            </button>
                          )}
                        </div>
                      )
                    )}

                    {/* Location Visibility (Authorised roles + Opted-in only) */}
                    <div className="neu-flat p-2.5 rounded-[8px] text-[11px] space-y-1">
                      {isCitizen ? (
                        <div className="text-[var(--text-secondary)]">
                          Live location hidden (restricted to authorised emergency officers).
                        </div>
                      ) : vol.optedInLocationSharing ? (
                        <div className="font-mono text-[var(--text-primary)]">
                          Live GPS (Opted-in): {vol.lat.toFixed(4)}°N, {vol.lng.toFixed(4)}°E
                        </div>
                      ) : (
                        <div className="text-[#CA8A04] font-semibold">
                          Volunteer has opted out of live location sharing.
                        </div>
                      )}
                    </div>
                  </div>

                  {!isCitizen && (
                    <div className="pt-2 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2 text-xs">
                      <a
                        href={`tel:${vol.phone}`}
                        className="font-mono font-bold text-[#0B8F80] flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>{vol.phone}</span>
                      </a>

                      <div className="flex items-center gap-1.5">
                        <select
                          value={vol.status}
                          onChange={(e) =>
                            updateVolunteerStatus(
                              vol.id,
                              e.target.value as 'Available' | 'Busy' | 'Offline'
                            )
                          }
                          className="neu-input px-2 py-1 text-[11px]"
                        >
                          <option value="Available">Available</option>
                          <option value="Busy">Busy</option>
                          <option value="Offline">Offline</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => toggleVolunteerLocationOptIn(vol.id)}
                          className="neu-btn px-2 py-1 text-[11px] font-semibold"
                        >
                          {vol.optedInLocationSharing ? 'Opt-Out GPS' : 'Opt-In GPS'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION C: IDRN RESOURCE INVENTORY (REGISTER, REQUEST, APPROVE & DISPATCH, LOW-STOCK WARNINGS) */}
      {activeTab === 'ndma_idrn' && (
        <div className="space-y-4">
          <div className="neu-raised p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#0B8F80]" strokeWidth={1.75} />
                  <span>
                    IDRN Resource Inventory (Boats, Ambulances, JCBs, Generators, Medical Kits, Food Packets)
                  </span>
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Request resources, approve & dispatch with automatic stock deduction and low-stock warnings
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search equipment or depot..."
                    value={resSearch}
                    onChange={(e) => setResSearch(e.target.value)}
                    className="neu-input pl-8 pr-3 py-1.5 text-xs"
                  />
                </div>
                {!isCitizen && (
                  <button
                    type="button"
                    onClick={() => setShowAddResourceForm((v) => !v)}
                    className="px-3 py-1.5 rounded-[8px] bg-[#0B8F80] text-white font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddResourceForm ? 'Close Form' : '+ Register Equipment'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Register New IDRN Resource Form */}
            {showAddResourceForm && !isCitizen && (
              <form
                onSubmit={handleAddResourceSubmit}
                className="neu-flat p-3.5 rounded-[10px] grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs items-end"
              >
                <input
                  type="text"
                  required
                  placeholder="Equipment Name (e.g., OBM Rescue Boat)"
                  value={newResItemName}
                  onChange={(e) => setNewResItemName(e.target.value)}
                  className="neu-input px-2.5 py-2"
                />
                <select
                  value={newResCategory}
                  onChange={(e) =>
                    setNewResCategory(e.target.value as ResourceStockItem['category'])
                  }
                  className="neu-input px-2.5 py-2"
                >
                  <option value="Rescue Boats">Rescue Boats</option>
                  <option value="Earthmovers (JCB)">Earthmovers (JCB)</option>
                  <option value="Relief Tents">Relief Tents</option>
                  <option value="Food Packets">Food Packets</option>
                  <option value="Medical Trauma Kits">Medical Trauma Kits</option>
                  <option value="Satellite Phones">Satellite Phones</option>
                </select>
                <select
                  value={newResDistrict}
                  onChange={(e) => setNewResDistrict(e.target.value)}
                  className="neu-input px-2.5 py-2"
                >
                  <option value="Raigad">Raigad</option>
                  <option value="Satara">Satara</option>
                  <option value="Pune">Pune</option>
                  <option value="Ratnagiri">Ratnagiri</option>
                  <option value="Kolhapur">Kolhapur</option>
                  <option value="Sindhudurg">Sindhudurg</option>
                </select>
                <input
                  type="text"
                  placeholder="Depot / Warehouse"
                  value={newResLocation}
                  onChange={(e) => setNewResLocation(e.target.value)}
                  className="neu-input px-2.5 py-2"
                />
                <input
                  type="number"
                  min={1}
                  max={10000}
                  placeholder="Quantity"
                  value={newResQty}
                  onChange={(e) => setNewResQty(Number(e.target.value))}
                  className="neu-input px-2.5 py-2 font-mono"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-[8px] bg-[#0B8F80] text-white font-bold"
                >
                  Save Resource
                </button>
              </form>
            )}

            {/* Request Resource Dispatch Form + Active Requests Queue (Acceptance Test #7) */}
            {!isCitizen && (
              <div className="neu-flat p-3.5 rounded-[10px] space-y-3 text-xs">
                <form
                  onSubmit={handleRequestResourceSubmit}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end"
                >
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                      Select IDRN Equipment
                    </label>
                    <select
                      value={reqResourceId}
                      onChange={(e) => setReqResourceId(e.target.value)}
                      className="neu-input w-full px-2.5 py-2 font-semibold"
                    >
                      {resourceStock.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.district} — Avail: {r.availableQty} {r.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                      Quantity Needed
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={reqQty}
                      onChange={(e) => setReqQty(Number(e.target.value))}
                      className="neu-input w-full px-2.5 py-2 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                      Destination / Incident Site
                    </label>
                    <input
                      type="text"
                      required
                      value={reqDestination}
                      onChange={(e) => setReqDestination(e.target.value)}
                      className="neu-input w-full px-2.5 py-2"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-[8px] bg-[#0B8F80] text-white font-bold flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Request Resource</span>
                  </button>
                </form>

                {/* Resource Requests Approval & Dispatch Queue */}
                <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                  <div className="font-bold text-[11px] uppercase tracking-wider text-[var(--text-secondary)]">
                    Resource Dispatch Requests ({resourceRequests.length})
                  </div>
                  {resourceRequests.map((req) => (
                    <div
                      key={req.id}
                      className="neu-raised px-3 py-2 rounded-[8px] flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-bold text-[var(--text-primary)]">
                          {req.itemName}
                        </span>{' '}
                        <span className="px-2 py-0.5 rounded bg-[#0B8F80]/15 text-[#0B8F80] font-mono font-bold">
                          Qty: {req.quantityRequested}
                        </span>{' '}
                        <span className="text-[var(--text-secondary)]">
                          → {req.destination} (Requested by {req.requestedBy} at {req.requestedAt})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                            req.status === 'Approved & Dispatched'
                              ? 'bg-emerald-500/20 text-[#15803D]'
                              : req.status === 'Requested'
                              ? 'bg-amber-500/20 text-[#CA8A04]'
                              : 'bg-red-500/20 text-[#DC2626]'
                          }`}
                        >
                          {req.status}
                        </span>
                        {isOfficerOrAdmin && req.status === 'Requested' && (
                          <button
                            type="button"
                            onClick={() => {
                              approveAndDispatchResourceRequest(req.id);
                              showToast(
                                `Approved & Dispatched ${req.quantityRequested} x ${req.itemName} to ${req.destination}. Stock reduced.`
                              );
                            }}
                            className="px-2.5 py-1 rounded bg-[#15803D] text-white font-bold text-[11px] flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approve & Dispatch</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resource Cards Grid with Low-Stock Warnings */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredResources.map((item) => {
                const isLowStock = item.availableQty <= item.minThresholdQty;
                return (
                  <div
                    key={item.id}
                    className={`neu-flat p-3.5 rounded-[10px] space-y-2 text-xs ${
                      isLowStock ? 'border border-[#DC2626]/60' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-[var(--text-primary)]">
                        {item.name}
                      </span>
                      {isLowStock ? (
                        <span className="px-2 py-0.5 rounded bg-[#DC2626] text-white font-bold text-[10px] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>LOW STOCK</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-[#15803D] text-white font-bold text-[10px]">
                          IN STOCK
                        </span>
                      )}
                    </div>

                    <div className="text-[var(--text-secondary)]">
                      {item.category} · {item.district} · {item.warehouseLocation}
                    </div>

                    <div className="neu-raised p-2 rounded-[8px] flex items-center justify-between font-mono">
                      <span>
                        Available:{' '}
                        <strong className={isLowStock ? 'text-[#DC2626]' : 'text-[#15803D]'}>
                          {item.availableQty}
                        </strong>{' '}
                        {item.unit}
                      </span>
                      <span className="text-[11px] text-[var(--text-secondary)]">
                        Deployed: {item.deployedQty} {item.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <NdmaPortalFeaturesHub defaultSection="idrn_ndrf" />
        </div>
      )}

      {/* COLLAPSED "MORE" SECTION: Full NDMA Portal Features Hub */}
      {activeTab !== 'ndma_idrn' && (
        <div className="neu-raised p-4">
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className="w-full flex items-center justify-between text-xs font-bold text-[var(--text-primary)]"
          >
            <span>
              More: All NDMA Portal Features (SACHET CAP, IDRN Equipment, Do&apos;s & Don&apos;ts, ERSS 112 / IMD / CWC / GSI Portals)
            </span>
            {moreOpen ? (
              <ChevronUp className="w-4 h-4" strokeWidth={1.75} />
            ) : (
              <ChevronDown className="w-4 h-4" strokeWidth={1.75} />
            )}
          </button>

          {moreOpen && (
            <div className="mt-3 pt-3 border-t border-[var(--border)]">
              <NdmaPortalFeaturesHub defaultSection="portals_kit" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
