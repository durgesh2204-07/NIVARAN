import React, { useEffect, useState } from 'react';
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  YAxis,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  BellRing,
  CheckCircle2,
  CheckSquare,
  MessageSquare,
  Pause,
  Play,
  PlusCircle,
  Radio,
  Send,
  Smartphone,
  Square,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { AlertItem, HazardType, Language } from '../types';

export const EarlyWarningPage: React.FC = () => {
  const villages = useAppStore((s) => s.villages);
  const sensors = useAppStore((s) => s.sensors);
  const alerts = useAppStore((s) => s.alerts);
  const tickSensors = useAppStore((s) => s.tickSensors);
  const triggerThresholdBreachDemo = useAppStore(
    (s) => s.triggerThresholdBreachDemo
  );
  const toggleEvacuationChecklistStep = useAppStore(
    (s) => s.toggleEvacuationChecklistStep
  );
  const acknowledgeAlert = useAppStore((s) => s.acknowledgeAlert);
  const createCapAlert = useAppStore((s) => s.createCapAlert);
  const addToast = useAppStore((s) => s.addToast);

  const [liveFeedActive, setLiveFeedActive] = useState(true);
  const [capModalAlert, setCapModalAlert] = useState<AlertItem | null>(null);
  const [capLang, setCapLang] = useState<Language>('en');
  const [composerOpen, setComposerOpen] = useState(false);

  // CAP Composer Form State
  const [targetVillageId, setTargetVillageId] = useState<string>('v-01');
  const [hazardType, setHazardType] = useState<HazardType>('landslide');
  const [severity, setSeverity] = useState<'critical' | 'high' | 'moderate'>('critical');
  const [urgency, setUrgency] = useState<'Immediate' | 'Expected' | 'Future'>('Immediate');
  const [certainty, setCertainty] = useState<'Observed' | 'Likely' | 'Possible'>('Observed');
  const [alertTitle, setAlertTitle] = useState<string>(
    'RED ALERT: Slope Saturation & Immediate Evacuation Advisory'
  );
  const [instructions, setInstructions] = useState<string>(
    'Proceed immediately along marked green evacuation corridor to the designated Relief Shelter. Carry essential medicines and identity documents.'
  );

  // Update sensor telemetry every 3.5 seconds
  useEffect(() => {
    if (!liveFeedActive) return;
    const timer = setInterval(() => {
      tickSensors();
    }, 3500);
    return () => clearInterval(timer);
  }, [liveFeedActive, tickSensors]);

  const getCapMessage = (alert: AlertItem, lang: Language): string => {
    if (lang === 'hi') {
      return `[NDMA SACHET / SDMA à¤®à¤¹à¤¾à¤°à¤¾à¤·à¥à¤Ÿà¥à¤° à¤†à¤ªà¤¾à¤¤à¤•à¤¾à¤²à¥€à¤¨ à¤šà¥‡à¤¤à¤¾à¤µà¤¨à¥€]\nà¤—à¤¾à¤à¤µ: ${alert.villageName} (${alert.district})\nà¤œà¥‹à¤–à¤¿à¤®: ${alert.hazardType.toUpperCase()} â€” à¤—à¤‚à¤­à¥€à¤° (RED ALERT)\nà¤¸à¤‚à¤¦à¥‡à¤¶: ${alert.villageName} à¤®à¥‡à¤‚ à¤¸à¥‡à¤‚à¤¸à¤° à¤¸à¥€à¤®à¤¾ à¤ªà¤¾à¤° à¤¹à¥‹ à¤—à¤ˆ à¤¹à¥ˆà¥¤ à¤•à¥ƒà¤ªà¤¯à¤¾ à¤¢à¤²à¤¾à¤¨/à¤¨à¤¦à¥€ à¤•à¤¿à¤¨à¤¾à¤°à¥‡ à¤¸à¥‡ à¤¤à¥à¤°à¤‚à¤¤ à¤¹à¤Ÿà¥‡à¤‚ à¤”à¤° à¤¨à¤¿à¤°à¥à¤§à¤¾à¤°à¤¿à¤¤ à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤†à¤¶à¥à¤°à¤¯ à¤¸à¥à¤¥à¤² à¤ªà¤° à¤ªà¤¹à¥à¤à¤šà¥‡à¤‚à¥¤ à¤¸à¤¹à¤¾à¤¯à¤¤à¤¾: 1077 / 112.`;
    }
    if (lang === 'mr') {
      return `[NDMA SACHET / SDMA à¤®à¤¹à¤¾à¤°à¤¾à¤·à¥à¤Ÿà¥à¤° à¤¤à¤¾à¤¤à¥à¤•à¤¾à¤³ à¤ªà¥‚à¤°à¥à¤µà¤¸à¥‚à¤šà¤¨à¤¾]\nà¤—à¤¾à¤µ: ${alert.villageName} (${alert.district})\nà¤§à¥‹à¤•à¤¾: ${alert.hazardType.toUpperCase()} â€” à¤…à¤¤à¤¿à¤§à¥‹à¤•à¤¾à¤¦à¤¾à¤¯à¤• (RED ALERT)\nà¤¸à¤‚à¤¦à¥‡à¤¶: ${alert.villageName} à¤®à¤§à¥€à¤² à¤¸à¥à¤µà¤¯à¤‚à¤šà¤²à¤¿à¤¤ à¤¸à¥‡à¤¨à¥à¤¸à¤°à¤¨à¥‡ à¤§à¥‹à¤•à¥à¤¯à¤¾à¤šà¥€ à¤ªà¤¾à¤¤à¤³à¥€ à¤“à¤²à¤¾à¤‚à¤¡à¤²à¥€ à¤†à¤¹à¥‡. à¤•à¥ƒà¤ªà¤¯à¤¾ à¤¡à¥‹à¤‚à¤—à¤° à¤‰à¤¤à¤¾à¤°/à¤¨à¤¦à¥€à¤•à¤¾à¤  à¤¤à¤¾à¤¤à¥à¤•à¤¾à¤³ à¤¸à¥‹à¤¡à¥‚à¤¨ à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤¨à¤¿à¤µà¤¾à¤°à¤¾ à¤•à¥‡à¤‚à¤¦à¥à¤°à¤¾à¤¤ à¤¸à¥à¤¥à¤²à¤¾à¤‚à¤¤à¤°à¤¿à¤¤ à¤µà¥à¤¹à¤¾. à¤¸à¤‚à¤ªà¤°à¥à¤•: 1077 / 112.`;
    }
    return `[NDMA SACHET / SDMA MAHARASHTRA CAP ALERT]\nSettlement: ${alert.villageName} (${alert.district} District)\nHazard: ${alert.hazardType.toUpperCase()} â€” SEVERITY: ${alert.severity.toUpperCase()} | URGENCY: ${alert.urgency || 'Immediate'}\nInstruction: ${alert.message} Helpline: 1077 / 112.`;
  };

  const handleDispatchCustomCap = (e: React.FormEvent) => {
    e.preventDefault();
    const targetV = villages.find((v) => v.id === targetVillageId) ?? villages[0];
    createCapAlert({
      villageId: targetV.id,
      villageName: targetV.name,
      district: targetV.district,
      hazardType,
      severity,
      urgency,
      certainty,
      title: alertTitle,
      message: instructions,
      evacuationChecklist: [
        {
          id: `ev-c1-${Date.now()}`,
          label: `Transmit Sachet CAP Cell Broadcast to ${targetV.name} towers`,
          department: 'SEOC Control Room',
          completed: true,
          completedAt: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        {
          id: `ev-c2-${Date.now()}`,
          label: `Activate Gram Panchayat Public Address Siren in ${targetV.name}`,
          department: 'Talathi & Police Patil',
          completed: false,
        },
        {
          id: `ev-c3-${Date.now()}`,
          label: `Escort vulnerable households to nearest verified Relief Shelter`,
          department: 'SDRF / Tehsil Rescue Unit',
          completed: false,
        },
      ],
    });
    setComposerOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-[#11253A] p-5 rounded-card shadow-soft border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-[#0F172A] dark:text-white">
            Early Warning Telemetry, CAP Broadcast & Evacuation Command
          </h1>
          <p className="text-xs text-[#475569] dark:text-slate-400 mt-1">
            Real-time IoT rain gauges, pore-water soil moisture probes, MEMS slope
            inclinometers, CWC river stages, and Sachet-style Common Alerting Protocol (CAP) dispatch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setComposerOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E9F8E] hover:bg-[#0B8375] text-white text-xs font-bold shadow-sm transition-all min-h-[42px]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Compose CAP Public Alert</span>
          </button>

          <button
            onClick={() => setLiveFeedActive((a) => !a)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0A1624] text-xs font-bold min-h-[42px]"
          >
            {liveFeedActive ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-500" />
                <span>Pause Sensor Stream</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Resume Sensor Stream</span>
              </>
            )}
          </button>

          <button
            onClick={triggerThresholdBreachDemo}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all min-h-[42px]"
          >
            <Zap className="w-4 h-4" />
            <span>Trigger Telemetry Breach (+Auto CAP)</span>
          </button>
        </div>
      </div>

      {/* Sachet-Style CAP Public Alert Composer Drawer/Panel */}
      {composerOpen && (
        <form
          onSubmit={handleDispatchCustomCap}
          className="bg-white dark:bg-[#11253A] rounded-card p-5 border-2 border-[#0E9F8E] shadow-soft space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0E9F8E]">
                ITU-T X.1303 Common Alerting Protocol (CAP v1.2)
              </span>
              <h2 className="font-heading font-bold text-base text-[#0F172A] dark:text-white">
                Compose Multi-Channel Public Emergency Broadcast
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setComposerOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">Target Habitation</label>
              <select
                value={targetVillageId}
                onChange={(e) => setTargetVillageId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-300 dark:border-slate-700 font-semibold"
              >
                {villages.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.district})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Hazard Event</label>
              <select
                value={hazardType}
                onChange={(e) => setHazardType(e.target.value as HazardType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-300 dark:border-slate-700 font-semibold uppercase"
              >
                <option value="landslide">Landslide</option>
                <option value="flood">Riverine Flood</option>
                <option value="cloudburst">Extreme Cloudburst</option>
                <option value="erosion">Slope Toe Erosion</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">CAP Severity</label>
              <select
                value={severity}
                onChange={(e) =>
                  setSeverity(e.target.value as 'critical' | 'high' | 'moderate')
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-300 dark:border-slate-700 font-semibold uppercase"
              >
                <option value="critical">Extreme / Red Alert</option>
                <option value="high">Severe / Orange Alert</option>
                <option value="moderate">Moderate / Yellow Watch</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">CAP Urgency</label>
              <select
                value={urgency}
                onChange={(e) =>
                  setUrgency(e.target.value as 'Immediate' | 'Expected' | 'Future')
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-300 dark:border-slate-700 font-semibold"
              >
                <option value="Immediate">Immediate (Take Action Now)</option>
                <option value="Expected">Expected (Within 1 Hour)</option>
                <option value="Future">Future (Pre-Monsoon Watch)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">CAP Certainty</label>
              <select
                value={certainty}
                onChange={(e) =>
                  setCertainty(e.target.value as 'Observed' | 'Likely' | 'Possible')
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-300 dark:border-slate-700 font-semibold"
              >
                <option value="Observed">Observed (Sensor / Field Verified)</option>
                <option value="Likely">Likely (&gt;75% Probability)</option>
                <option value="Possible">Possible</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">Broadcast Headline</label>
              <input
                type="text"
                value={alertTitle}
                onChange={(e) => setAlertTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-300 dark:border-slate-700"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Protective Action Instructions (Auto-translated to EN / HI / MR)
              </label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-300 dark:border-slate-700"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-[11px] text-slate-500">
              Delivery Channels: Cell Broadcast SMS Â· Nivaran Citizen App Â· WhatsApp Gram
              Panchayat FileText Â· Village Acoustic Sirens
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Transmit CAP Alert Now</span>
            </button>
          </div>
        </form>
      )}

      {/* 4 Live Sensor Sparkline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sensors.map((s) => {
          const isCrit = s.status === 'critical';
          const isWarn = s.status === 'warning';
          const color = isCrit ? '#DC2626' : isWarn ? '#F97316' : '#16A34A';

          return (
            <div
              key={s.id}
              className={`bg-white dark:bg-[#11253A] rounded-card p-4 shadow-soft border transition-all flex flex-col justify-between space-y-3 ${
                isCrit
                  ? 'border-[#DC2626] ring-2 ring-[#DC2626]/25'
                  : 'border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0E9F8E]">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span>
                      {s.villageName} ({s.district})
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-[#0F172A] dark:text-white mt-0.5">
                    {s.label}
                  </div>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-white"
                  style={{ backgroundColor: color }}
                >
                  {s.status}
                </span>
              </div>

              <div className="flex items-baseline justify-between tabular-nums">
                <div>
                  <span
                    className="font-heading text-2xl font-extrabold"
                    style={{ color }}
                  >
                    {s.currentValue}
                  </span>{' '}
                  <span className="text-xs text-slate-500">{s.unit}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Crit: {s.criticalThreshold} {s.unit}
                </div>
              </div>

              {/* Sparkline Chart */}
              <div className="h-20 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={s.history}>
                    <YAxis domain={['auto', 'auto']} hide />
                    <ReferenceLine
                      y={s.criticalThreshold}
                      stroke="#DC2626"
                      strokeDasharray="3 3"
                    />
                    <RechartsTooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={color}
                      strokeWidth={2.5}
                      dot={{ r: 2 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Alerts & Evacuation Countdown Workflow Checklists */}
      <div className="space-y-4">
        <h2 className="font-heading font-bold text-lg text-[#0F172A] dark:text-white flex items-center gap-2">
          <BellRing className="w-5 h-5 text-[#DC2626]" />
          <span>
            Active Early Warning Alerts & Evacuation Countdown Workflows ({alerts.length})
          </span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {alerts.map((alert) => {
            const completedCount = alert.evacuationChecklist.filter(
              (c) => c.completed
            ).length;
            const totalSteps = alert.evacuationChecklist.length;
            const pct = Math.round((completedCount / Math.max(1, totalSteps)) * 100);

            return (
              <div
                key={alert.id}
                className="bg-white dark:bg-[#11253A] rounded-card shadow-soft border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase text-white ${
                          alert.severity === 'critical'
                            ? 'bg-[#DC2626]'
                            : alert.severity === 'high'
                            ? 'bg-[#F97316]'
                            : 'bg-[#EAB308]'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="font-heading font-bold text-sm text-[#0F172A] dark:text-white">
                        {alert.villageName} ({alert.district})
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{alert.timestamp}</span>
                  </div>

                  <h3 className="font-heading font-extrabold text-base text-[#DC2626] dark:text-red-300">
                    {alert.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {alert.message}
                  </p>

                  {/* Multi-Channel Delivery Telemetry */}
                  {alert.deliveryStats && (
                    <div className="grid grid-cols-4 gap-2 pt-1 text-[10px]">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0A1624] border border-slate-200/70 dark:border-slate-800">
                        <div className="text-slate-400 flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-[#0E9F8E]" /> SMS Sent
                        </div>
                        <div className="font-bold text-xs tabular-nums">
                          {alert.deliveryStats.smsSent.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0A1624] border border-slate-200/70 dark:border-slate-800">
                        <div className="text-slate-400">App Push</div>
                        <div className="font-bold text-xs tabular-nums">
                          {alert.deliveryStats.appPushDelivered.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0A1624] border border-slate-200/70 dark:border-slate-800">
                        <div className="text-slate-400">WhatsApp</div>
                        <div className="font-bold text-xs tabular-nums">
                          {alert.deliveryStats.whatsappBroadcast.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0A1624] border border-slate-200/70 dark:border-slate-800">
                        <div className="text-slate-400 flex items-center gap-1">
                          <Volume2 className="w-3 h-3 text-[#DC2626]" /> Sirens
                        </div>
                        <div className="font-bold text-xs tabular-nums">
                          {alert.deliveryStats.sirensActivated} Active
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Evacuation Countdown Workflow Checklist */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0F172A] dark:text-white flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-[#0E9F8E]" />
                      <span>Evacuation Countdown Workflow Checklist</span>
                    </span>
                    <span className="font-bold text-[#0E9F8E] tabular-nums">
                      {completedCount}/{totalSteps} ({pct}%)
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-[#0E9F8E] transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="space-y-2 pt-1">
                    {alert.evacuationChecklist.map((step) => (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() =>
                          toggleEvacuationChecklistStep(alert.id, step.id)
                        }
                        className="w-full text-left p-2.5 rounded-xl bg-white dark:bg-[#11253A] border border-slate-200/80 dark:border-slate-800 hover:border-[#0E9F8E] flex items-start justify-between gap-2 text-xs transition-all"
                      >
                        <div className="flex items-start gap-2">
                          {step.completed ? (
                            <CheckSquare className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div
                              className={`font-semibold ${
                                step.completed
                                  ? 'line-through text-slate-400'
                                  : 'text-[#0F172A] dark:text-white'
                              }`}
                            >
                              {step.label}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Agency: {step.department}
                            </div>
                          </div>
                        </div>
                        {step.completedAt && (
                          <span className="text-[10px] font-mono text-[#16A34A] shrink-0">
                            âœ“ {step.completedAt}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => setCapModalAlert(alert)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B1F33] hover:bg-[#11253A] text-white text-xs font-bold min-h-[40px]"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#0E9F8E]" />
                    <span>Preview & Re-Broadcast CAP / SMS</span>
                  </button>

                  {!alert.acknowledged ? (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0E9F8E]/15 text-[#0E9F8E] hover:bg-[#0E9F8E] hover:text-white text-xs font-bold min-h-[40px]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Acknowledge Alert</span>
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-[#16A34A] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged by SEOC
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SMS / CAP Alert Preview Modal in English, Hindi, Marathi */}
      {capModalAlert && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#0B1F33]/65 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-[#11253A] w-full max-w-lg rounded-card shadow-soft-lg border border-slate-200 dark:border-slate-700 overflow-hidden space-y-4">
            <div className="bg-[#0B1F33] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#EAB308]" />
                <div>
                  <h3 className="font-heading font-bold text-base">
                    NDMA Sachet CAP / SMS Broadcast Preview
                  </h3>
                  <p className="text-xs text-slate-300">
                    Target Cell Towers: {capModalAlert.villageName} & 5 km radius
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCapModalAlert(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 space-y-4">
              {/* Language Switcher for SMS Preview */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">
                  Select Broadcast Language:
                </span>
                <div className="flex gap-1 bg-slate-100 dark:bg-[#0A1624] p-1 rounded-xl">
                  {(['en', 'hi', 'mr'] as Language[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => setCapLang(l)}
                      className={`px-3 py-1 rounded-lg font-bold ${
                        capLang === l
                          ? 'bg-[#0E9F8E] text-white'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {l === 'en' ? 'English' : l === 'hi' ? 'à¤¹à¤¿à¤¨à¥à¤¦à¥€' : 'à¤®à¤°à¤¾à¤ à¥€'}
                    </button>
                  ))}
                </div>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-300 font-mono text-xs whitespace-pre-wrap leading-relaxed border border-slate-700">
                {getCapMessage(capModalAlert, capLang)}
              </pre>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-[#0A1624] border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setCapModalAlert(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  addToast({
                    title: 'CAP / SMS Broadcast Dispatched',
                    message: `Multilingual alert transmitted to ${capModalAlert.villageName} residents & Gram Panchayat.`,
                    type: 'success',
                  });
                  setCapModalAlert(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white text-xs font-bold"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch CAP Broadcast Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

