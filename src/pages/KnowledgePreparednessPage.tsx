import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Download,
  GraduationCap,
  Phone,
  PlusCircle,
  Search,
  ShieldCheck,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { useAppStore } from '../store/useAppStore';

interface SopDocument {
  id: string;
  code: string;
  title: string;
  category: 'Landslide' | 'Flood' | 'Relocation' | 'Relief Camp';
  agency: string;
  updatedAt: string;
  summary: string;
  keySteps: string[];
}

const SOP_LIBRARY: SopDocument[] = [
  {
    id: 'sop-01',
    code: 'NDMA-SOP-LS-2026-01',
    title: 'Standard Operating Procedure for Pre-Monsoon Western Ghats Landslide Red Zone Evacuation',
    category: 'Landslide',
    agency: 'NDMA & GSI Landslide Studies Division',
    updatedAt: 'May 2026',
    summary:
      'Mandatory protocol for evacuating habitations with composite Hazard Score > 0.75 or when 6-hour tipping-bucket rainfall exceeds 180 mm.',
    keySteps: [
      'Issue Sachet CAP Alert in Marathi/Hindi 6 hours prior to projected IMD Red Alert peak.',
      'Deploy Talathi, Police Patil, and Aapda Mitra volunteers for door-to-door verification of elderly & disabled citizens.',
      'Activate green OSRM road corridor to pre-identified Relief Camp; log arrival headcount in Nivaran Shelter Registry.',
    ],
  },
  {
    id: 'sop-02',
    code: 'SDMA-SOP-REL-2026-02',
    title: 'SPHERE & NDMA Carrying-Capacity Verification for Permanent Rehabilitation Host Sites',
    category: 'Relocation',
    agency: 'Maharashtra SDMA & Revenue Rehabilitation Wing',
    updatedAt: 'June 2026',
    summary:
      'Establishes minimum per-household land allocation (0.08 ha), perennial groundwater index, and mandatory +20-year climate hazard re-check before site allotment.',
    keySteps: [
      'Verify usable plateau area (slope < 8°) and exclude 200m river flood buffers.',
      'Compute Safe Capacity = (Usable Area / 0.08 ha) × Water Reliability Score.',
      'Record Gram Sabha consent, sanction compensation, and seal stage transitions on the SHA-256 Relocation Ledger.',
    ],
  },
  {
    id: 'sop-03',
    code: 'DDMA-SOP-FL-2026-03',
    title: 'Savitri, Vashishti & Panchganga Basin Flash Flood & Dam Release Protocol',
    category: 'Flood',
    agency: 'Central Water Commission (CWC) & Konkan DDMA',
    updatedAt: 'June 2026',
    summary:
      'Coordinates Koyna/Warna reservoir discharge schedules with downstream riverbank evacuation and NDRF inflatable boat pre-positioning.',
    keySteps: [
      'Monitor CWC radar river gauges at Mahad, Chiplun, and Karveer every 15 minutes.',
      'Close low-lying causeways when water reaches Warning Level; pre-position NDRF rescue boats.',
      'Ensure chlorination of drinking water and medical trauma desk readiness at all active camps.',
    ],
  },
  {
    id: 'sop-04',
    code: 'NDMA-SOP-RC-2026-04',
    title: 'Minimum Standards of Relief (MSR) in Emergency Shelters & Transit Camps',
    category: 'Relief Camp',
    agency: 'Ministry of Home Affairs (DM Division) & SDMA',
    updatedAt: 'April 2026',
    summary:
      'Defines dignity, sanitation, nutrition, lighting, and women/child safety standards inside disaster relief shelters.',
    keySteps: [
      'Provide minimum 3.5 sq.m covered floor area per person and separate sanitation blocks for women.',
      'Maintain 15 liters/person/day potable water and 2,400 kcal hot cooked meals from community kitchens.',
      'Conduct daily medical screening and maintain live occupancy telemetry on Nivaran.',
    ],
  },
];

const EMERGENCY_CONTACTS = [
  {
    office: 'State Emergency Operations Center (SEOC), Mantralaya Mumbai',
    officer: 'State Relief Commissioner & Control Room Director',
    phone: '022-22027990 / 1070',
    vhfChannel: 'VHF Ch-14 (164.550 MHz)',
  },
  {
    office: 'Raigad District Control Room (DDMA Alibag)',
    officer: 'Resident Deputy Collector & DEOC In-Charge',
    phone: '02141-222118 / 1077',
    vhfChannel: 'VHF Ch-08 (162.325 MHz)',
  },
  {
    office: 'Ratnagiri District Control Room (Chiplun-Khed Division)',
    officer: 'District Disaster Management Officer (DDMO)',
    phone: '02352-222233 / 1077',
    vhfChannel: 'VHF Ch-09 (162.800 MHz)',
  },
  {
    office: 'Pune & Satara Ghat Division Control Room',
    officer: 'Commandant, NDRF 5th Battalion (Sudumbare Pune)',
    phone: '020-26123371 / 9422318800',
    vhfChannel: 'SATCOM / VHF Ch-01',
  },
];

export const KnowledgePreparednessPage: React.FC = () => {
  const villages = useAppStore((s) => s.villages);
  const addToast = useAppStore((s) => s.addToast);

  const [searchQuery, setSearchQuery] = useState('');
  const [drills, setDrills] = useState([
    {
      id: 'dr-01',
      title: 'Pre-Monsoon Night Landslide Evacuation Drill',
      villageName: 'Irshalwadi (Raigad)',
      date: '2026-06-15 18:30 IST',
      participants: 185,
      agencies: 'NDRF 5th Bn, Khalapur Tehsildar, Aapda Mitra',
      status: 'Completed (9.5 min clearance)',
    },
    {
      id: 'dr-02',
      title: 'Vashishti River Flood Siren & Boat Rescue Simulation',
      villageName: 'Chiplun Bazar Peth (Ratnagiri)',
      date: '2026-06-22 10:00 IST',
      participants: 340,
      agencies: 'SDRF Dhule/Nagpur Detachment, Municipal Fire Brigade',
      status: 'Scheduled',
    },
    {
      id: 'dr-03',
      title: 'Ghat Slope Crack Reporting & Sachet CAP Verification Drill',
      villageName: 'Malin / Ambegaon (Pune)',
      date: '2026-06-28 11:00 IST',
      participants: 210,
      agencies: 'GSI Geologists, Talathi, Gram Panchayat DMC',
      status: 'Scheduled',
    },
  ]);

  const [newDrillTitle, setNewDrillTitle] = useState('');
  const [newDrillVillage, setNewDrillVillage] = useState(villages[0]?.name || 'Irshalwadi');
  const [newDrillDate, setNewDrillDate] = useState('2026-07-05 10:30');

  const filteredSops = SOP_LIBRARY.filter(
    (s) =>
      !searchQuery.trim() ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleScheduleDrill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrillTitle.trim()) return;
    setDrills((prev) => [
      {
        id: `dr-${Date.now()}`,
        title: newDrillTitle.trim(),
        villageName: newDrillVillage,
        date: `${newDrillDate} IST`,
        participants: 150,
        agencies: 'DDMA, Tehsildar, Local Aapda Mitra Unit',
        status: 'Scheduled',
      },
      ...prev,
    ]);
    setNewDrillTitle('');
    addToast({
      title: 'Mock Drill Scheduled',
      message: `Added "${newDrillTitle}" for ${newDrillVillage} to District Preparedness Calendar.`,
      type: 'success',
    });
  };

  const handleDownloadSopPdf = (sop: SopDocument) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    doc.setFillColor(11, 31, 51);
    doc.rect(0, 0, 595, 76, 'F');
    doc.setTextColor(14, 159, 142);
    doc.setFontSize(9);
    doc.text(`${sop.code} • ${sop.agency}`, 40, 26);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    const titleLines = doc.splitTextToSize(sop.title, 515);
    doc.text(titleLines, 40, 45);

    let y = 108;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text('1. Operational Mandate & Trigger Criteria', 40, y);
    y += 16;
    doc.setFontSize(10);
    const sumLines = doc.splitTextToSize(sop.summary, 510);
    doc.text(sumLines, 40, y);
    y += sumLines.length * 14 + 20;

    doc.setFontSize(11);
    doc.text('2. Mandatory Action Checklist for Field & Command Officers', 40, y);
    y += 18;
    doc.setFontSize(10);
    sop.keySteps.forEach((step, idx) => {
      const lines = doc.splitTextToSize(`${idx + 1}. ${step}`, 505);
      doc.text(lines, 46, y);
      y += lines.length * 14 + 8;
    });

    doc.save(`${sop.code}.pdf`);
    addToast({
      title: 'SOP Document Downloaded',
      message: `Saved ${sop.code}.pdf for field reference.`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#11253A] p-5 rounded-card shadow-soft border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0E9F8E]">
            <BookOpen className="w-4 h-4" />
            <span>NDMA / SDMA Knowledge Repository & Capacity Building</span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold text-[#0F172A] dark:text-white mt-0.5">
            Standard Operating Procedures (SOPs), Mock-Drill Scheduler & Directory
          </h1>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SOPs by hazard, code, agency..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200 dark:border-slate-700 text-xs"
          />
        </div>
      </div>

      {/* SOP Library Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSops.map((sop) => (
          <div
            key={sop.id}
            className="bg-white dark:bg-[#11253A] rounded-card p-5 border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col justify-between space-y-4 text-xs"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded bg-[#0B1F33] text-white font-mono text-[10px] font-bold">
                  {sop.code}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#0E9F8E]/15 text-[#0E9F8E] font-bold text-[10px] uppercase">
                  {sop.category}
                </span>
              </div>
              <h2 className="font-heading font-bold text-base text-[#0F172A] dark:text-white">
                {sop.title}
              </h2>
              <div className="text-[11px] text-slate-500">
                Issuing Authority: {sop.agency} • Revised: {sop.updatedAt}
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {sop.summary}
              </p>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A1624] space-y-1.5">
                {sop.keySteps.map((st, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0E9F8E] shrink-0 mt-0.5" />
                    <span>{st}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => handleDownloadSopPdf(sop)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B1F33] hover:bg-slate-800 text-white font-bold"
              >
                <Download className="w-3.5 h-3.5 text-[#0E9F8E]" />
                <span>Download Official SOP (PDF)</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Mock-Drill Scheduler + Training Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white dark:bg-[#11253A] rounded-card p-5 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0E9F8E]" />
              <h2 className="font-heading font-bold text-base text-[#0F172A] dark:text-white">
                Village Evacuation Mock-Drill Scheduler
              </h2>
            </div>
            <span className="text-xs font-bold text-[#0E9F8E]">
              {drills.length} Drills Logged
            </span>
          </div>

          <form
            onSubmit={handleScheduleDrill}
            className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs p-3 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200 dark:border-slate-800"
          >
            <input
              type="text"
              value={newDrillTitle}
              onChange={(e) => setNewDrillTitle(e.target.value)}
              placeholder="Drill exercise title..."
              className="sm:col-span-5 px-3 py-2 rounded-lg bg-white dark:bg-[#11253A] border border-slate-300 dark:border-slate-700"
              required
            />
            <select
              value={newDrillVillage}
              onChange={(e) => setNewDrillVillage(e.target.value)}
              aria-label="Select drill village"
              className="sm:col-span-3 px-2.5 py-2 rounded-lg bg-white dark:bg-[#11253A] border border-slate-300 dark:border-slate-700"
            >
              {villages.slice(0, 15).map((v) => (
                <option key={v.id} value={`${v.name} (${v.district})`}>
                  {v.name} ({v.district})
                </option>
              ))}
            </select>
            <input
              type="text"
              value={newDrillDate}
              onChange={(e) => setNewDrillDate(e.target.value)}
              className="sm:col-span-2 px-2.5 py-2 rounded-lg bg-white dark:bg-[#11253A] border border-slate-300 dark:border-slate-700 font-mono text-[11px]"
            />
            <button
              type="submit"
              className="sm:col-span-2 px-3 py-2 rounded-lg bg-[#0E9F8E] text-white font-bold flex items-center justify-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Add
            </button>
          </form>

          <div className="space-y-2.5">
            {drills.map((d) => (
              <div
                key={d.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-bold text-[#0F172A] dark:text-white">
                    {d.title}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Habitation: <strong>{d.villageName}</strong> • Agencies: {d.agencies}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-[#0E9F8E]">{d.date}</div>
                  <div className="text-[10px] text-slate-500">
                    {d.participants} participants • {d.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contacts & VHF Directory (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#11253A] rounded-card p-5 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#4F46E5]" />
            <h2 className="font-heading font-bold text-base text-[#0F172A] dark:text-white">
              SEOC / DEOC Emergency Contacts & VHF Directory
            </h2>
          </div>

          <div className="space-y-2.5 text-xs">
            {EMERGENCY_CONTACTS.map((c, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200/80 dark:border-slate-800 space-y-1"
              >
                <div className="font-bold text-[#0F172A] dark:text-white">
                  {c.office}
                </div>
                <div className="text-[11px] text-slate-500">{c.officer}</div>
                <div className="flex items-center justify-between pt-1">
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-[#0E9F8E]">
                    <Phone className="w-3 h-3" /> {c.phone}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-mono text-[10px]">
                    {c.vhfChannel}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-[#0E9F8E]/10 border border-[#0E9F8E]/30 text-xs flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#0E9F8E] shrink-0" />
            <span>
              <strong>Aapda Mitra Community Volunteer Cadre:</strong> 1,420 trained first
              responders equipped with life-jackets, stretchers, and satellite radios across
              6 Western Ghats districts.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
