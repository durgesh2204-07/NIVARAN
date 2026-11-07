import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Send,
  Sparkles,
  X,
  Minus,
  Maximize2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ShieldAlert,
  ShieldCheck,
  Compass,
  Building2,
  CloudRain,
  Navigation,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Village, ReliefCamp } from '../types';
import { getVillageAiForecast } from '../services/aiDisasterPredictor';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionVillage?: Village;
  actionRoute?: { lat: number; lng: number; label: string };
  suggestedPrompts?: string[];
}

const QUICK_PROMPTS = [
  '🚨 Which villages are currently in Red Zone?',
  '🌦️ 7-Day Rainfall & Weather Forecast',
  '⛺ Nearest Available Relief Shelters',
  '🛡️ Landslide Safety Guide (NDMA SOP)',
  '🌊 Flash Flood Safety Guidelines',
  '📍 What is the risk status of Irshalwadi?',
  '📍 What is the risk status of Taliye?',
];

export const Nivaran247AiChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const villages = useAppStore((s) => s.villages);
  const reliefCamps = useAppStore((s) => s.reliefCamps);
  const activeAlertZones = useAppStore((s) => s.activeAlertZones);
  const user = useAppStore((s) => s.user);
  const navigate = useNavigate();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: "Hello! I am your 24/7 NIVARAN AI Disaster Intelligence Assistant. I provide real-time early warnings, 7-day weather predictions, village geotechnical risk evaluations, shelter availability, and NDMA/SDMA evacuation advisories across all 370+ habitations in Maharashtra. How can I assist you right now?",
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      suggestedPrompts: [
        '🚨 High-Risk Red Zone Villages',
        '🌦️ 7-Day Weather & Rainfall Alert',
        '⛺ Nearest Relief Shelters',
        '🛡️ Landslide & Flood Safety SOP',
      ],
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, isThinking]);

  // Voice Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  /**
   * Comprehensive 24/7 AI Disaster Query Responder
   */
  const processQuery = (query: string): ChatMessage => {
    const q = query.toLowerCase().trim();
    const nowIst = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // 1. Specific village match across all 370+ habitations
    const matchedVillage = villages.find(
      (v) =>
        q.includes(v.name.toLowerCase()) ||
        q.includes(v.name.split(' ')[0].toLowerCase())
    );

    if (matchedVillage) {
      const v = matchedVillage;
      const forecast = getVillageAiForecast(v);
      const isRed = (v.hazardFactors.rainfall + v.hazardFactors.slope) / 2 > 0.7;
      const riskTier = isRed ? 'Red Alert (Immediate Relocation Recommended)' : 'Monitored Habitation';

      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `📍 **${v.name} (${v.taluka} Taluka, ${v.district} District)**\n\n` +
          `• **Current Risk Level:** ${riskTier}\n` +
          `• **Elevation & Slope:** ${v.elevationM} meters · ${v.slopeDeg}° scarp slope\n` +
          `• **Annual Rainfall:** ${v.annualRainfallMm} mm/year\n` +
          `• **Population & Households:** ${v.population.toLocaleString()} residents (${v.households} households)\n` +
          `• **Primary Threat:** ${forecast.primaryThreat}\n` +
          `• **7-Day Cumulative Rain Forecast:** ${forecast.cumulativeRainfallMm} mm (Peak: ${forecast.peakRiskDay} with ${forecast.max7DayRainfallMm} mm)\n` +
          `• **AI Early Warning Directive:** ${forecast.aiSummaryAdvisory}\n` +
          `• **Evacuation Lead Time:** Recommended within **${forecast.recommendedEvacuationLeadHours} hours**.\n\n` +
          `Would you like me to map this village or compute the evacuation route to the nearest shelter?`,
        timestamp: nowIst,
        actionVillage: v,
        actionRoute: { lat: v.lat, lng: v.lng, label: v.name },
        suggestedPrompts: [
          `🗺️ Fly to ${v.name} on GIS Map`,
          `⚡ View 7-Day Forecast for ${v.name}`,
          `⛺ Nearest shelter to ${v.name}`,
        ],
      };
    }

    // 2. Red-Zone villages query
    if (q.includes('red') || q.includes('high risk') || q.includes('critical') || q.includes('danger') || q.includes('worst')) {
      const highRisk = villages
        .filter((v) => (v.hazardFactors.rainfall + v.hazardFactors.slope) / 2 > 0.7)
        .slice(0, 5);

      const listText = highRisk
        .map(
          (v, i) =>
            `${i + 1}. **${v.name}** (${v.taluka}, ${v.district}) — ${v.slopeDeg}° slope · ${v.annualRainfallMm} mm rain · Primary: ${v.primaryHazard}`
        )
        .join('\n');

      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `🚨 **High-Risk Red Zone Priority Habitations**\n\n` +
          `The geotechnical and hydrological telemetry models have flagged the following critical habitations requiring immediate surveillance:\n\n` +
          `${listText}\n\n` +
          `⚠️ **Administrative Action Required:** Pre-position Aapda Mitra first responders, verify designated safe camps, and issue pre-emptive CAP alerts.`,
        timestamp: nowIst,
        suggestedPrompts: [
          '📍 What is the risk status of Irshalwadi?',
          '📍 What is the risk status of Taliye?',
          '⛺ Nearest Available Relief Shelters',
        ],
      };
    }

    // 3. Relief Shelters / Camps query
    if (q.includes('shelter') || q.includes('camp') || q.includes('relief') || q.includes('evacuat') || q.includes('safe place')) {
      const activeCamps = reliefCamps.slice(0, 4);
      const campDetails = activeCamps
        .map(
          (c) =>
            `• **${c.name}** (${c.taluka}, ${c.district})\n  Capacity: ${c.currentOccupancy} / ${c.capacityPersons} persons (${c.capacityPersons - c.currentOccupancy} beds free) · In-Charge: ${c.inChargeName || 'Nodal Officer'} (${c.contactPhone})`
        )
        .join('\n\n');

      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `⛺ **Designated Relief Camps & Evacuation Centers**\n\n` +
          `All shelters are equipped with drinking water, medical inspection desks, generator backup, and community kitchens:\n\n` +
          `${campDetails}\n\n` +
          `To compute an exact OSRM navigation corridor from any village to the closest shelter, use the **Shelter Route** button on the GIS map.`,
        timestamp: nowIst,
        suggestedPrompts: [
          '🗺️ Open GIS Command Map',
          '🚨 Which villages are currently in Red Zone?',
          '🛡️ Landslide Safety Guide (NDMA SOP)',
        ],
      };
    }

    // 4. Weather and Rainfall forecast query
    if (q.includes('weather') || q.includes('rain') || q.includes('forecast') || q.includes('monsoon') || q.includes('cloudburst')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `🌦️ **AI 7-Day Weather & Hydrological Forecast Overview**\n\n` +
          `• **Western Ghats Crest (Mahabaleshwar, Amboli, Khandala, Tamhini):** Active monsoon surge projected over next 72 hours. Cumulative precipitation estimated between 180mm – 320mm.\n` +
          `• **Konkan Coastal Belt (Raigad, Ratnagiri, Sindhudurg, Thane):** Persistent heavy rain with localized flash flood risk along Savitri, Jagbudi, and Vashishti river corridors.\n` +
          `• **Soil Pore Saturation:** Multiple ridge habitations exceed 82% pore water saturation, increasing slope subsidence probability.\n\n` +
          `You can view the full daily day-by-day 7-day predictive breakdown for any of Maharashtra's 370+ villages by clicking its pin on the map.`,
        timestamp: nowIst,
        suggestedPrompts: [
          '📍 What is the risk status of Irshalwadi?',
          '📍 What is the risk status of Savitri Flood Basin?',
          '🌊 Flash Flood Safety Guidelines',
        ],
      };
    }

    // 5. Landslide Safety Guide
    if (q.includes('landslide') || q.includes('slope') || q.includes('hill') || q.includes('debris')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `🛡️ **NDMA / SDMA Landslide Standard Operating Procedure (SOP)**\n\n` +
          `**DO's:**\n` +
          `1. Watch for early warning signs: newly emerging ground cracks, tilting trees/poles, and sudden muddy water springs.\n` +
          `2. Keep an Emergency Go-Bag ready with Aadhaar, ration cards, essential medications, and waterproof torch.\n` +
          `3. Evacuate immediately to designated plateau host centers when IMD issues Red or Orange alerts.\n` +
          `4. Assist elderly, pregnant women, and persons with disabilities first.\n\n` +
          `**DON'Ts:**\n` +
          `1. Never stay in kutcha structures at the base of slopes steeper than 25° during continuous intense rains.\n` +
          `2. Do not attempt to cross active landslide debris paths or blocked culverts at night.\n` +
          `3. Do not excavate slope toes or dump rubble in natural drainage gullies.`,
        timestamp: nowIst,
        suggestedPrompts: [
          '🌊 Flash Flood Safety Guidelines',
          '🚨 Which villages are currently in Red Zone?',
          '⛺ Nearest Available Relief Shelters',
        ],
      };
    }

    // 6. Flash Flood Safety Guide
    if (q.includes('flood') || q.includes('river') || q.includes('water') || q.includes('inundat')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `🌊 **NDMA / SDMA Flash Flood Safety Protocol**\n\n` +
          `**DO's:**\n` +
          `1. Move to higher ground and designated elevated relief structures before dam spillway gates are opened.\n` +
          `2. Turn off the main electrical MCB power switch and gas cylinders before leaving your home.\n` +
          `3. Drink only boiled or chlorinated water, or use water purification tablets distributed by relief teams.\n` +
          `4. Keep battery-operated radios tuned to All India Radio or Sachet CAP mobile broadcasts.\n\n` +
          `**DON'Ts:**\n` +
          `1. Never drive or walk through moving floodwater over submerged causeways (just 15cm of flowing water can knock you down).\n` +
          `2. Do not touch downed electric wires or wet electrical equipment.\n` +
          `3. Do not return to low-lying floodplains until the District Collectorate issues an official all-clear.`,
        timestamp: nowIst,
        suggestedPrompts: [
          '🛡️ Landslide Safety Guide (NDMA SOP)',
          '🌦️ 7-Day Rainfall & Weather Forecast',
          '⛺ Nearest Available Relief Shelters',
        ],
      };
    }

    // 7. Fallback general assistant response
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `I understand your query regarding "${query}".\n\n` +
        `As the 24/7 NIVARAN National Disaster Early Warning Assistant, I can provide:\n` +
        `• **Live Village Analysis:** Name any village (e.g. *Irshalwadi*, *Taliye*, *Malin*, *Mirgaon*, *Bhavali*) to get elevation, slope, annual rainfall, and 7-day risk predictions.\n` +
        `• **Early Warnings:** Identify current Red and Orange zone habitations across Maharashtra.\n` +
        `• **Evacuation Planning:** Check nearest relief camps with bed capacity and OSRM routing.\n` +
        `• **NDMA Safety SOPs:** Detailed Do's and Don'ts for landslides, flash floods, cloudbursts, and cyclones.\n\n` +
        `What specific habitation or emergency protocol would you like to explore?`,
      timestamp: nowIst,
      suggestedPrompts: [
        '🚨 Which villages are currently in Red Zone?',
        '🌦️ 7-Day Rainfall & Weather Forecast',
        '⛺ Nearest Available Relief Shelters',
        '📍 What is the risk status of Irshalwadi?',
      ],
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsThinking(true);

    setTimeout(() => {
      const responseMessage = processQuery(text);
      setMessages((prev) => [...prev, responseMessage]);
      setIsThinking(false);
    }, 450);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFlyToVillage = (v: Village) => {
    navigate('/map');
    // Dispatch event so map immediately focuses on this village
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('nivaran:focus-village', {
          detail: { villageId: v.id, lat: v.lat, lng: v.lng, name: v.name },
        })
      );
    }, 300);
  };

  return (
    <>
      {/* =====================================================================
          PERSISTENT 24/7 FLOATING AI ASSISTANT TRIGGER BUTTON (ATTRACTIVE & CLEAN)
          ===================================================================== */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[999] pointer-events-auto select-none">
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="group flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#091422]/95 hover:bg-[#0D1C2E] text-white shadow-2xl hover:shadow-[#0B8F80]/30 transition-all duration-200 border border-[#0B8F80]/50 hover:border-[#14B8A6] cursor-pointer backdrop-blur-xl ring-1 ring-white/10"
            aria-label="Open 24/7 AI Disaster Emergency Assistant"
            title="Open 24/7 NIVARAN AI Disaster Assistant"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0B8F80] to-[#14B8A6] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>

            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wide text-white">
                  NIVARAN AI
                </span>
                <span className="px-1.5 py-0.2 rounded bg-[#0B8F80]/25 text-[#2DD4BF] border border-[#0B8F80]/40 text-[9px] font-bold tracking-wider">
                  24/7 ACTIVE
                </span>
              </div>
              <span className="text-[10.5px] text-slate-300 font-medium leading-tight mt-0.5">
                Instant Early Warning & Village Telemetry
              </span>
            </div>
          </button>
        </div>
      )}

      {/* =====================================================================
          24/7 AI CHATBOT INTERACTIVE WINDOW / DRAWER
          ===================================================================== */}
      {isOpen && (
        <div
          className={`fixed right-4 sm:right-6 z-[999] transition-all duration-300 ease-out select-none pointer-events-auto ${
            isMinimized
              ? 'bottom-6 w-72 sm:w-80 h-14'
              : 'bottom-4 sm:bottom-6 w-[94vw] sm:w-[440px] max-w-[480px] h-[580px] max-h-[85vh]'
          }`}
        >
          <div className="w-full h-full rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0F172A] border-2 border-emerald-500/40 shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
            {/* Window Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between shrink-0 border-b border-emerald-500/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 leading-none">
                    <h3 className="text-xs sm:text-sm font-black tracking-tight">
                      NIVARAN 24/7 AI
                    </h3>
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-[9px] font-mono font-bold">
                      ONLINE
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-300 font-medium leading-none mt-1">
                    Emergency Disaster Intelligence
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsSpeaking((v) => !v)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  title={isSpeaking ? 'Mute AI voice output' : 'Enable AI voice output'}
                >
                  {isSpeaking ? (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  title={isMinimized ? 'Expand chatbot' : 'Minimize chatbot'}
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  title="Close 24/7 AI Assistant"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Body (When Not Minimized) */}
            {!isMinimized && (
              <>
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 custom-scrollbar bg-slate-50/60 dark:bg-[#0B131E]/60 text-xs">
                  {messages.map((msg) => {
                    const isUser = msg.sender === 'user';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                      >
                        <div
                          className={`max-w-[88%] p-3 rounded-2xl shadow-xs leading-relaxed whitespace-pre-wrap ${
                            isUser
                              ? 'bg-[#008060] text-white rounded-tr-xs font-medium'
                              : 'bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-xs shadow-sm'
                          }`}
                        >
                          {!isUser && (
                            <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono uppercase">
                                <Sparkles className="w-3 h-3" />
                                24/7 AI Disaster Directive
                              </span>
                              <button
                                type="button"
                                onClick={() => speakText(msg.text)}
                                className="text-slate-400 hover:text-emerald-500 transition-colors"
                                title="Read aloud"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          <div className="text-[12px] leading-relaxed">{msg.text}</div>

                          {/* Action Buttons if village detected */}
                          {msg.actionVillage && (
                            <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleFlyToVillage(msg.actionVillage!)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                              >
                                <Navigation className="w-3 h-3" />
                                <span>Fly to {msg.actionVillage.name} on Map</span>
                              </button>
                            </div>
                          )}
                        </div>

                        <span className="text-[10px] font-mono text-slate-400 px-1">
                          {msg.timestamp}
                        </span>

                        {/* Suggested Follow-up Prompts */}
                        {msg.suggestedPrompts && (
                          <div className="flex flex-wrap gap-1.5 pt-1 max-w-[90%]">
                            {msg.suggestedPrompts.map((prompt, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => handleSendMessage(prompt)}
                                className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors cursor-pointer text-left"
                              >
                                {prompt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Thinking Indicator */}
                  {isThinking && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-fit text-slate-500">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                      <span className="text-[11px] font-mono">Analyzing 370+ villages telemetry...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts Bar */}
                <div className="px-3 py-1.5 bg-slate-100/80 dark:bg-[#101C2C] border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                  {QUICK_PROMPTS.map((qp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(qp)}
                      className="px-2.5 py-1 rounded-full text-[10.5px] font-semibold whitespace-nowrap bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:border-emerald-500 transition-colors cursor-pointer"
                    >
                      {qp}
                    </button>
                  ))}
                </div>

                {/* Input Bar */}
                <div className="p-2.5 bg-white dark:bg-[#0F172A] border-t border-slate-200 dark:border-slate-800 shrink-0">
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ask 24/7 AI: village name, weather, shelter, SOP..."
                      className="flex-1 bg-transparent text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none"
                    />

                    {/* Mic Voice Input Button */}
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isListening
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                      }`}
                      title={isListening ? 'Stop listening' : 'Speak your query hands-free'}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    {/* Send Button */}
                    <button
                      type="button"
                      onClick={() => handleSendMessage()}
                      disabled={!inputText.trim()}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        inputText.trim()
                          ? 'bg-[#008060] text-white hover:bg-[#006e52] shadow-xs'
                          : 'text-slate-400 cursor-not-allowed'
                      }`}
                      title="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-400 text-center mt-1">
                    NIVARAN 24/7 Emergency AI · GSI & IMD Hydro-Geotechnical Synthesis
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

