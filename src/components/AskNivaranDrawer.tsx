import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Database,
  ExternalLink,
  Mic,
  MicOff,
  Send,
  Scale,
  Volume2,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { askNivaranAssistant } from '../services/gemini';
import { greedyMatch } from '../utils/scoring';
import { Language } from '../types';

interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  source?: string;
  dataSources?: string[];
  deepLinkPath?: string;
  deepLinkLabel?: string;
}

const SAMPLE_PROMPTS: Record<Language, string[]> = {
  en: [
    'Which villages in Raigad are high risk this monsoon?',
    'Explain why Irshalwadi is ranked #1 in Red Zone.',
    'What is the carrying capacity of Mahad MIDC Safe Plateau?',
    'Show me active shelters and nearest evacuation routes.',
  ],
  hi: [
    'à¤‡à¤¸ à¤®à¤¾à¤¨à¤¸à¥‚à¤¨ à¤®à¥‡à¤‚ à¤•à¥Œà¤¨ à¤¸à¥‡ à¤—à¤¾à¤à¤µ à¤‰à¤šà¥à¤š à¤œà¥‹à¤–à¤¿à¤® (Red Zone) à¤®à¥‡à¤‚ à¤¹à¥ˆà¤‚?',
    'à¤‡à¤°à¤¶à¤¾à¤³à¤µà¤¾à¤¡à¥€ à¤°à¥ˆà¤‚à¤• #1 à¤ªà¤° à¤•à¥à¤¯à¥‹à¤‚ à¤¹à¥ˆ?',
    'à¤®à¤¹à¤¾à¤¡ MIDC à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤ªà¤ à¤¾à¤° à¤•à¥€ à¤§à¤¾à¤°à¤£ à¤•à¥à¤·à¤®à¤¤à¤¾ (Carrying Capacity) à¤•à¥à¤¯à¤¾ à¤¹à¥ˆ?',
  ],
  mr: [
    'à¤¯à¤¾ à¤ªà¤¾à¤µà¤¸à¤¾à¤³à¥à¤¯à¤¾à¤¤ à¤•à¥‹à¤£à¤¤à¥€ à¤—à¤¾à¤µà¥‡ à¤…à¤¤à¤¿à¤§à¥‹à¤•à¤¾à¤¦à¤¾à¤¯à¤• (Red Zone) à¤†à¤¹à¥‡à¤¤?',
    'à¤‡à¤°à¤¶à¤¾à¤³à¤µà¤¾à¤¡à¥€ à¤•à¥à¤°à¤®à¤¾à¤‚à¤• #1 à¤µà¤° à¤•à¤¾ à¤†à¤¹à¥‡?',
    'à¤®à¤¹à¤¾à¤¡ MIDC à¤ªà¤ à¤¾à¤°à¤¾à¤šà¥€ à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤•à¥à¤Ÿà¥à¤‚à¤¬ à¤•à¥à¤·à¤®à¤¤à¤¾ à¤•à¤¿à¤¤à¥€ à¤†à¤¹à¥‡?',
  ],
};

export const AskNivaranDrawer: React.FC = () => {
  const open = useAppStore((s) => s.askNivaranOpen);
  const setOpen = useAppStore((s) => s.setAskNivaranOpen);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const villages = useAppStore((s) => s.villages);
  const sites = useAppStore((s) => s.sites);
  const weights = useAppStore((s) => s.weights);
  const climateHorizon = useAppStore((s) => s.climateHorizon);
  const extraRainfallMm = useAppStore((s) => s.extraRainfallMm);
  const navigate = useNavigate();

  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text:
        language === 'hi'
          ? 'à¤¨à¤®à¤¸à¥à¤¤à¥‡! à¤®à¥ˆà¤‚ à¤¨à¤¿à¤µà¤¾à¤°à¤£ AI à¤¸à¤¹à¤¾à¤¯à¤• à¤¹à¥‚à¤à¥¤ à¤†à¤ª à¤®à¥à¤à¤¸à¥‡ à¤ªà¤¶à¥à¤šà¤¿à¤®à¥€ à¤˜à¤¾à¤Ÿ à¤•à¥‡ à¤°à¥‡à¤¡-à¤œà¤¼à¥‹à¤¨ à¤—à¤¾à¤à¤µà¥‹à¤‚, à¤ªà¥à¤¨à¤°à¥à¤µà¤¾à¤¸ à¤•à¥à¤·à¤®à¤¤à¤¾, à¤°à¤¾à¤¹à¤¤ à¤¶à¤¿à¤µà¤¿à¤°à¥‹à¤‚ à¤¯à¤¾ à¤•à¤¿à¤¸à¥€ à¤­à¥€ à¤—à¤¾à¤à¤µ à¤•à¥‡ à¤¸à¥à¤•à¥‹à¤° à¤•à¥‡ à¤¬à¤¾à¤°à¥‡ à¤®à¥‡à¤‚ à¤ªà¥‚à¤› à¤¸à¤•à¤¤à¥‡ à¤¹à¥ˆà¤‚à¥¤'
          : language === 'mr'
          ? 'à¤¨à¤®à¤¸à¥à¤•à¤¾à¤°! à¤®à¥€ à¤¨à¤¿à¤µà¤¾à¤°à¤£ AI à¤¸à¤¹à¤¾à¤¯à¥à¤¯à¤• à¤†à¤¹à¥‡. à¤¤à¥à¤®à¥à¤¹à¥€ à¤®à¤²à¤¾ à¤ªà¤¶à¥à¤šà¤¿à¤® à¤˜à¤¾à¤Ÿà¤¾à¤¤à¥€à¤² à¤°à¥‡à¤¡-à¤à¥‹à¤¨ à¤—à¤¾à¤µà¥‡, à¤ªà¥à¤¨à¤°à¥à¤µà¤¸à¤¨ à¤•à¥à¤·à¤®à¤¤à¤¾, à¤®à¤¦à¤¤ à¤›à¤¾à¤µà¤£à¥à¤¯à¤¾ à¤•à¤¿à¤‚à¤µà¤¾ à¤•à¥‹à¤£à¤¤à¥à¤¯à¤¾à¤¹à¥€ à¤—à¤¾à¤µà¤¾à¤šà¥à¤¯à¤¾ à¤¸à¥à¤•à¥‹à¤…à¤°à¤¬à¤¦à¥à¤¦à¤² à¤µà¤¿à¤šà¤¾à¤°à¥‚ à¤¶à¤•à¤¤à¤¾.'
          : 'Namaste! I am Ask Nivaran, your multilingual NDMA/SDMA Decision Assistant. Ask me about high-risk Red Zone habitations, site carrying capacity, shelters, or relocation rankings in English, Hindi, or Marathi.',
      dataSources: ['GSI Landslide Inventory', 'Open-Meteo Telemetry', 'Census 2011 PCA'],
      deepLinkPath: '/gis',
      deepLinkLabel: 'Open GIS Map Workspace',
    },
  ]);

  if (!open) return null;

  const rankedVillages = greedyMatch(villages, sites, weights, {
    climateHorizon,
    extraRainfallMm,
  });

  const inferDeepLink = (queryText: string): { path: string; label: string; sources: string[] } => {
    const q = queryText.toLowerCase();
    if (q.includes('capacity') || q.includes('site') || q.includes('mahad') || q.includes('à¤•à¥à¤·à¤®à¤¤à¤¾')) {
      return {
        path: '/site-suitability',
        label: 'Open Site Suitability & Carrying Capacity',
        sources: ['PM Gati Shakti Infrastructure', 'CGWB Groundwater Atlas', 'ISRO CartoDEM 10m'],
      };
    }
    if (q.includes('shelter') || q.includes('camp') || q.includes('à¤¶à¤¿à¤µà¤¿à¤°') || q.includes('à¤›à¤¾à¤µà¤£à¥à¤¯à¤¾')) {
      return {
        path: '/resources',
        label: 'Open Relief Camps & Resource Registry',
        sources: ['IDRN Resource Network', 'District Relief Camp Registry', 'OSRM Road Graph'],
      };
    }
    if (q.includes('rank') || q.includes('relocat') || q.includes('à¤°à¥ˆà¤‚à¤•') || q.includes('à¤•à¥à¤°à¤®à¤¾à¤‚à¤•')) {
      return {
        path: '/priority-ranking',
        label: 'Open Priority Ranking & Relocation Planner',
        sources: ['GSI Landslide Atlas', 'Open-Meteo Live Telemetry', 'Census 2011 Vulnerability'],
      };
    }
    return {
      path: '/hazard-map',
      label: 'Open Hazard & Red Zone Mapping',
      sources: ['IMD / Open-Meteo Rainfall API', 'ISRO CartoDEM Slope', 'GSI Landslide History'],
    };
  };

  const handleSend = async (customQuery?: string) => {
    const q = (customQuery ?? input).trim();
    if (!q || loading) return;
    setInput('');
    const userTurn: ChatTurn = { id: `u-${Date.now()}`, role: 'user', text: q };
    setMessages((prev) => [...prev, userTurn]);
    setLoading(true);

    const res = await askNivaranAssistant(q, language, rankedVillages, sites);
    const meta = inferDeepLink(q);
    const botTurn: ChatTurn = {
      id: `b-${Date.now()}`,
      role: 'assistant',
      text: res.answer,
      source: res.source,
      dataSources: meta.sources,
      deepLinkPath: meta.path,
      deepLinkLabel: meta.label,
    };
    setMessages((prev) => [...prev, botTurn]);
    setLoading(false);
  };

  const handleVoiceInput = () => {
    const SpeechRecognitionAPI =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        const sampleQ = SAMPLE_PROMPTS[language][0];
        setInput(sampleQ);
        handleSend(sampleQ);
      }, 1200);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognitionAPI as any)();
      recognition.lang =
        language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
      recognition.interimResults = false;
      setIsListening(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        setIsListening(false);
        if (transcript) {
          setInput(transcript);
          handleSend(transcript);
        }
      };
      recognition.onerror = () => {
        setIsListening(false);
      };
      recognition.onend = () => {
        setIsListening(false);
      };
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[990] flex justify-end bg-[#0B1F33]/50 backdrop-blur-xs"
      role="dialog"
      aria-label="Ask Nivaran Assistant"
    >
      <div className="bg-white dark:bg-[#11253A] w-full max-w-md h-full flex flex-col shadow-2xl border-l border-slate-200 dark:border-slate-800">
        {/* Top bar */}
        <div className="bg-[#0B1F33] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0E9F8E]/20 border border-[#0E9F8E] flex items-center justify-center text-[#0E9F8E]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-heading font-bold text-base">Ask Nivaran AI</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#0E9F8E] text-white">
                  Voice + Text
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Multilingual NDMA / SDMA Decision Assistant
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close Ask Nivaran"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language bar */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#0A1624] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Assistant Language:</span>
          <div className="flex gap-1">
            {(['en', 'hi', 'mr'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={`px-2.5 py-1 rounded-md font-semibold ${
                  language === l
                    ? 'bg-[#0E9F8E] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {l === 'en' ? 'English' : l === 'hi' ? 'à¤¹à¤¿à¤¨à¥à¤¦à¥€' : 'à¤®à¤°à¤¾à¤ à¥€'}
              </button>
            ))}
          </div>
        </div>

        {/* Suggested prompts */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0A1624]/50">
          <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
            <Scale className="w-3 h-3 text-[#0E9F8E]" />
            <span>Quick Queries (Click to ask):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_PROMPTS[language].map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#11253A] hover:bg-[#0E9F8E]/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#0B1F33] text-white rounded-br-xs'
                    : 'bg-slate-100 dark:bg-[#0A1624] text-[#0F172A] dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-xs'
                }`}
              >
                <p>{m.text}</p>
                {m.role === 'assistant' && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-2">
                    {m.dataSources && m.dataSources.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                        <Database className="w-3 h-3 text-[#0E9F8E] shrink-0" />
                        <span>Sources:</span>
                        {m.dataSources.map((src) => (
                          <span
                            key={src}
                            className="px-1.5 py-0.5 rounded bg-white dark:bg-[#11253A] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                          >
                            {src}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      {m.deepLinkPath ? (
                        <button
                          onClick={() => {
                            setOpen(false);
                            navigate(m.deepLinkPath!);
                          }}
                          className="inline-flex items-center gap-1 text-[#4F46E5] dark:text-indigo-400 font-semibold hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{m.deepLinkLabel}</span>
                        </button>
                      ) : (
                        <span>
                          {m.source === 'gemini'
                            ? 'Google Gemini + GIS Engine'
                            : 'Nivaran Deterministic Engine'}
                        </span>
                      )}
                      <button
                        onClick={() => speakText(m.text)}
                        className="inline-flex items-center gap-1 text-[#0E9F8E] font-semibold hover:underline"
                      >
                        <Volume2 className="w-3 h-3" /> Speak
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-xs text-slate-500 italic flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0E9F8E] animate-ping" />
              Analyzing 40 Western Ghats habitations, 25 shelters & 12 relocation sites...
            </div>
          )}
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white dark:bg-[#11253A] border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
        >
          <button
            type="button"
            onClick={handleVoiceInput}
            className={`p-2.5 rounded-xl border min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors ${
              isListening
                ? 'bg-[#DC2626] text-white border-[#DC2626] animate-pulse'
                : 'bg-slate-100 dark:bg-[#0A1624] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#0E9F8E]'
            }`}
            title="Voice input (Web Speech API)"
            aria-label="Voice input"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              language === 'hi'
                ? 'à¤…à¤ªà¤¨à¤¾ à¤ªà¥à¤°à¤¶à¥à¤¨ à¤ªà¥‚à¤›à¥‡à¤‚...'
                : language === 'mr'
                ? 'à¤¤à¥à¤®à¤šà¤¾ à¤ªà¥à¤°à¤¶à¥à¤¨ à¤µà¤¿à¤šà¤¾à¤°à¤¾...'
                : 'Ask about Red Zones, sites, shelters, villages...'
            }
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-[#0E9F8E]"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-[#0E9F8E] hover:bg-[#0B8375] disabled:opacity-40 text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Send question"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

