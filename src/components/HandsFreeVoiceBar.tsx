import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike | undefined;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike | undefined;
  };
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

interface HandsFreeVoiceBarProps {
  compact?: boolean;
  liveCoords?: { lat: number; lng: number };
}

export const HandsFreeVoiceBar: React.FC<HandsFreeVoiceBarProps> = ({
  compact = false,
  liveCoords = { lat: 18.6517, lng: 73.7615 },
}) => {
  const language = useAppStore((s) => s.language);
  const villages = useAppStore((s) => s.villages);
  const reliefCamps = useAppStore((s) => s.reliefCamps);
  const sites = useAppStore((s) => s.sites);
  const dispatchSosEmergency = useAppStore((s) => s.dispatchSosEmergency);
  const addToast = useAppStore((s) => s.addToast);

  // OFF by default — only listens when the user clicks "Live Voice"
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [spokenText, setSpokenText] = useState<string>('');
  const [answerText, setAnswerText] = useState<string>('');

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const latestInterimRef = useRef<string>('');
  const answeredRef = useRef<boolean>(false);

  const speakAloud = useCallback(
    (textToSpeak: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(textToSpeak);
      utter.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
      utter.rate = 0.98;
      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utter);
    },
    [language]
  );

  // Build intelligent operational answer for whatever the user spoke
  const processSpokenQuery = useCallback(
    (query: string) => {
      const q = query.trim();
      if (!q) return;

      const lower = q.toLowerCase();
      const latStr = liveCoords.lat.toFixed(4);
      const lngStr = liveCoords.lng.toFixed(4);

      // 1. Check if user named any specific village/habitation in our 40 villages
      const matchedVillage = villages.find((v) =>
        lower.includes(v.name.toLowerCase()) || lower.includes(v.district.toLowerCase())
      );

      let replyEn = '';
      let replyHi = '';
      let replyMr = '';

      if (
        lower.includes('sos') ||
        lower.includes('help') ||
        lower.includes('bachao') ||
        lower.includes('madat') ||
        lower.includes('बचाओ') ||
        lower.includes('मदत') ||
        lower.includes('emergency')
      ) {
        const rec = dispatchSosEmergency({
          lat: liveCoords.lat,
          lng: liveCoords.lng,
          accuracyMeters: 8,
          note: `Voice SOS triggered: "${q}"`,
        });
        replyEn = `Emergency SOS dispatched for "${q}". Reference ${rec.referenceNo} logged at GPS ${latStr}°N, ${lngStr}°E. ERSS 112 and NDRF Control Room notified.`;
        replyHi = `आपकी आवाज़ "${q}" पर आपातकालीन एसओएस भेज दिया गया है। संदर्भ संख्या ${rec.referenceNo}, जीपीएस ${latStr}° उत्तर, ${lngStr}° पूर्व। 112 नियंत्रण कक्ष को सूचित किया गया है।`;
        replyMr = `तुमच्या "${q}" या आवाजावरून तात्काळ एसओएस पाठवला आहे. संदर्भ क्रमांक ${rec.referenceNo}, जीपीएस ${latStr}° उत्तर, ${lngStr}° पूर्व.`;
      } else if (matchedVillage) {
        replyEn = `${matchedVillage.name} in ${matchedVillage.district} District (${matchedVillage.taluka}): Population ${matchedVillage.population}, ${matchedVillage.households} households, Primary hazard is ${matchedVillage.primaryHazard}, Slope ${matchedVillage.slopeDeg}°, Annual rainfall ${matchedVillage.annualRainfallMm} mm. Coordinates: ${matchedVillage.lat.toFixed(4)}°N, ${matchedVillage.lng.toFixed(4)}°E.`;
        replyHi = `${matchedVillage.name} (${matchedVillage.district} जिला): जनसंख्या ${matchedVillage.population}, ${matchedVillage.households} परिवार, मुख्य आपदा जोखिम ${matchedVillage.primaryHazard}, ढलान ${matchedVillage.slopeDeg} डिग्री, वर्षा ${matchedVillage.annualRainfallMm} मिमी।`;
        replyMr = `${matchedVillage.name} (${matchedVillage.district} जिल्हा): लोकसंख्या ${matchedVillage.population}, ${matchedVillage.households} कुटुंबे, मुख्य धोका ${matchedVillage.primaryHazard}, उतार ${matchedVillage.slopeDeg} अंश.`;
      } else if (
        lower.includes('location') ||
        lower.includes('where am i') ||
        lower.includes('gps') ||
        lower.includes('coordinate') ||
        lower.includes('लोकेशन') ||
        lower.includes('स्थान')
      ) {
        replyEn = `Your current live GPS coordinates are ${latStr}° North, ${lngStr}° East. Nearest Green Zone relief shelter is ${reliefCamps[0]?.name || 'Khalapur Relief Camp'}.`;
        replyHi = `आपका वर्तमान लाइव जीपीएस स्थान ${latStr} डिग्री उत्तर, ${lngStr} डिग्री पूर्व है। निकटतम सुरक्षित राहत शिविर ${reliefCamps[0]?.name || 'खालापुर राहत शिविर'} है।`;
        replyMr = `तुमचे सध्याचे लाईव्ह जीपीएस लोकेशन ${latStr} अंश उत्तर, ${lngStr} अंश पूर्व आहे. जवळचे सुरक्षित मदत शिबिर ${reliefCamps[0]?.name || 'खालापूर मदत शिबिर'} आहे.`;
      } else if (
        lower.includes('shelter') ||
        lower.includes('camp') ||
        lower.includes('safe') ||
        lower.includes('green zone') ||
        lower.includes('शिविर') ||
        lower.includes('छावणी')
      ) {
        replyEn = `There are ${reliefCamps.length} Green Zone Relief Shelters and ${sites.length} Safe Relocation Sites operational. Top safe sites include ${sites
          .slice(0, 3)
          .map((s) => s.name)
          .join(', ')}.`;
        replyHi = `कुल ${reliefCamps.length} ग्रीन ज़ोन राहत शिविर और ${sites.length} सुरक्षित पुनर्वास स्थल सक्रिय हैं। प्रमुख सुरक्षित स्थल: ${sites
          .slice(0, 3)
          .map((s) => s.name)
          .join(', ')}।`;
        replyMr = `एकूण ${reliefCamps.length} ग्रीन झोन मदत शिबिरे आणि ${sites.length} सुरक्षित पुनर्वसन स्थळे कार्यरत आहेत.`;
      } else if (
        lower.includes('red zone') ||
        lower.includes('hazard') ||
        lower.includes('landslide') ||
        lower.includes('flood') ||
        lower.includes('risk')
      ) {
        replyEn = `Red Zone Hazard Summary: High-risk habitations include Irshalwadi (Raigad), Taliye (Mahad), Malin (Pune), and Chiplun (Ratnagiri). Immediate evacuation to Green Zone shelters is advised when 24-hour rainfall exceeds 150 mm.`;
        replyHi = `रेड ज़ोन आपदा सारांश: उच्च जोखिम वाले गाँवों में इरशालवाडी, तळीये, मालीण और चिपलून शामिल हैं। भारी वर्षा में तुरंत ग्रीन ज़ोन शिविर में जाने की सलाह दी जाती है।`;
        replyMr = `रेड झोन आपत्ती माहिती: इरशाळवाडी, तळीये, माळीण आणि चिपळूण हे अतिधोकादायक क्षेत्रात आहेत. तात्काळ ग्रीन झोन शिबिरात स्थलांतर करावे.`;
      } else if (
        lower.includes('112') ||
        lower.includes('sachet') ||
        lower.includes('ndma') ||
        lower.includes('helpline') ||
        lower.includes('number')
      ) {
        replyEn = `National Emergency Numbers: Dial 112 for ERSS Emergency Response, 1078 for NDMA Control Room, 1070 for State Emergency Operations Centre, and 1077 for District Control Room. Official portals 112.gov.in and sachet.ndma.gov.in are available in the National Portals tab.`;
        replyHi = `राष्ट्रीय आपातकालीन नंबर: ईआरएसएस के लिए 112, एनडीएमए के लिए 1078, राज्य नियंत्रण कक्ष के लिए 1070 और जिला नियंत्रण कक्ष के लिए 1077 डायल करें।`;
        replyMr = `राष्ट्रीय तात्काळ क्रमांक: ईआरएसएससाठी 112, एनडीएमएसाठी 1078, राज्य नियंत्रण कक्षासाठी 1070 आणि जिल्हा नियंत्रण कक्षासाठी 1077 डायल करा.`;
      } else {
        replyEn = `Voice query received: "${q}". Live GPS is active at ${latStr}°N, ${lngStr}°E. Monitoring ${villages.length} habitations, ${reliefCamps.length} relief shelters, and ${sites.length} relocation sites. Ask about any village name, live GPS location, Red Zone risk, Green Zone shelter, or say SOS for emergency dispatch.`;
        replyHi = `आपने कहा: "${q}"। आपका लाइव जीपीएस ${latStr}°N, ${lngStr}°E पर सक्रिय है। प्रणाली में ${villages.length} गाँव और ${reliefCamps.length} राहत शिविर उपलब्ध हैं।`;
        replyMr = `तुम्ही म्हणालात: "${q}". तुमचे लाईव्ह जीपीएस ${latStr}°N, ${lngStr}°E वर सक्रिय आहे. प्रणालीमध्ये ${villages.length} गावे आणि ${reliefCamps.length} मदत शिबिरे उपलब्ध आहेत.`;
      }

      const finalAnswer =
        language === 'hi' ? replyHi : language === 'mr' ? replyMr : replyEn;

      setSpokenText(q);
      setAnswerText(finalAnswer);
      speakAloud(finalAnswer);

      addToast({
        title: `Voice Query: "${q}"`,
        message: finalAnswer,
        type: 'info',
      });
    },
    [
      liveCoords.lat,
      liveCoords.lng,
      villages,
      reliefCamps,
      sites,
      language,
      dispatchSosEmergency,
      speakAloud,
      addToast,
    ]
  );

  // Click-to-Speak handler: starts mic ONLY when clicked, listens once, answers, and stops!
  const handleClickLiveVoice = () => {
    // If currently listening, stop listening
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
      return;
    }

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      processSpokenQuery('Live GPS Location and Red Zone Status');
      return;
    }

    answeredRef.current = false;
    latestInterimRef.current = '';
    setSpokenText('');
    setAnswerText('');

    const recognition = new Ctor();
    recognition.continuous = false; // Single shot: automatically turns off after you speak!
    recognition.interimResults = true;
    recognition.lang =
      language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let interim = '';
      let finalPhrase = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res?.[0]?.transcript?.trim() || '';
        if (!text) continue;
        if (res?.isFinal) {
          finalPhrase += (finalPhrase ? ' ' : '') + text;
        } else {
          interim += (interim ? ' ' : '') + text;
        }
      }

      if (interim) {
        latestInterimRef.current = interim;
        setSpokenText(interim);
      }

      if (finalPhrase && !answeredRef.current) {
        answeredRef.current = true;
        try {
          recognition.stop();
        } catch {
          // ignore
        }
        setIsListening(false);
        processSpokenQuery(finalPhrase);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      if (!answeredRef.current && latestInterimRef.current) {
        answeredRef.current = true;
        processSpokenQuery(latestInterimRef.current);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (!answeredRef.current && latestInterimRef.current) {
        answeredRef.current = true;
        processSpokenQuery(latestInterimRef.current);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleVoiceAlertBroadcast = () => {
    if (isSpeaking && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const latStr = liveCoords.lat.toFixed(4);
    const lngStr = liveCoords.lng.toFixed(4);
    const alertMsg =
      language === 'hi'
        ? `निवारण नियंत्रण कक्ष से आपातकालीन सूचना। आपका लाइव जीपीएस ${latStr} उत्तर, ${lngStr} पूर्व है। रायगड और इरशालवाडी क्षेत्र के लिए रेड अलर्ट सक्रिय है। कृपया सुरक्षित ग्रीन ज़ोन राहत शिविर में जाएँ।`
        : language === 'mr'
        ? `निवारण नियंत्रण कक्षाकडून तात्काळ सूचना. तुमचे लाईव्ह जीपीएस लोकेशन ${latStr} उत्तर, ${lngStr} पूर्व आहे. रायगड आणि इरशाळवाडी परिसरासाठी रेड अलर्ट जारी करण्यात आला आहे.`
        : `Emergency Warning from Nivaran Control Room. Your live GPS is locked at ${latStr} degrees North, ${lngStr} degrees East. Red Alert is active for Irshalwadi and Mahad sectors. Move vulnerable households to the nearest Green Zone relief shelter.`;

    setAnswerText(alertMsg);
    speakAloud(alertMsg);
  };

  return (
    <div className="relative inline-flex flex-wrap items-center gap-1.5">
      {/* Click-to-Speak Voice Assistant Button (Only active when clicked!) */}
      <button
        type="button"
        onClick={handleClickLiveVoice}
        title="Click and speak to get instant voice information about any location, shelter, hazard, or emergency"
        className={`px-3 py-1.5 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-all ${
          isListening
            ? 'bg-[#DC2626] text-white shadow-md ring-2 ring-red-400'
            : 'bg-[#0B8F80] hover:bg-[#087366] text-white shadow-sm'
        }`}
      >
        {isListening ? (
          <>
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <Mic className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Listening... Speak Now</span>
          </>
        ) : (
          <>
            <MicOff className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>{compact ? 'Click & Speak' : 'Live Voice (Click to Speak)'}</span>
          </>
        )}
      </button>

      {/* Voice Alert Siren / Advisory Broadcast Button */}
      <button
        type="button"
        onClick={handleVoiceAlertBroadcast}
        className={`px-2.5 py-1.5 rounded-[8px] text-xs font-bold flex items-center gap-1.5 ${
          isSpeaking
            ? 'bg-[#EA580C] text-white'
            : 'neu-btn text-[var(--text-primary)] border border-[#EA580C]/40'
        }`}
      >
        {isSpeaking ? (
          <VolumeX className="w-3.5 h-3.5" strokeWidth={1.75} />
        ) : (
          <Volume2 className="w-3.5 h-3.5 text-[#EA580C]" strokeWidth={1.75} />
        )}
        <span>{isSpeaking ? 'Stop Audio' : 'Voice Alert'}</span>
      </button>

      {/* Spoken Query & Answer Popover Banner */}
      {(spokenText || answerText) && (
        <div className="fixed bottom-4 right-4 z-[1300] max-w-md w-full neu-raised p-4 border-2 border-[#0B8F80] bg-[var(--surface)] text-[var(--text-primary)] shadow-2xl space-y-2">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-1.5">
            <span className="text-xs font-bold text-[#0B8F80] flex items-center gap-1.5">
              <Volume2 className="w-4 h-4" strokeWidth={2} />
              <span>Nivaran Voice Response</span>
            </span>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
                setIsSpeaking(false);
                setSpokenText('');
                setAnswerText('');
              }}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>
          {spokenText && (
            <div className="text-xs font-mono bg-[#0B1F33] text-emerald-300 px-2.5 py-1.5 rounded">
              You said: "{spokenText}"
            </div>
          )}
          {answerText && (
            <p className="text-xs leading-relaxed text-[var(--text-primary)] font-medium">
              {answerText}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
