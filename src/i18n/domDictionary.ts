import {
  INITIAL_RELIEF_CAMPS,
  INITIAL_RELOCATION_SITES,
  INITIAL_VILLAGES,
  INTERVENTION_OPTIONS,
} from '../data/mockData';
import { Language } from '../types';

/**
 * Exact Phrase Dictionary for Hindi ('hi') and Marathi ('mr') covering all 17 modules,
 * LoginPage, AppLayout, GIS Engine, Modals, Command Palette, KPIs, Buttons, and Labels.
 */
export const EXACT_PHRASES: Record<string, { hi: string; mr: string }> = {
// Brand & Login Page (3-Zone Workspace + Offline Area Mode + Multilingual)
  'Welcome to NIVARAN': {
    hi: 'निवारण (NIVARAN) में आपका स्वागत है',
    mr: 'निवारण (NIVARAN) मध्ये आपले स्वागत आहे',
  },
'Sign in to continue': {
    hi: 'आगे बढ़ने के लिए साइन इन करें',
    mr: 'पुढे जाण्यासाठी साइन इन करा',
  },
'Select Role': {
    hi: 'भूमिका चुनें',
    mr: 'भूमिका निवडा',
  },
'SDMA State': {
    hi: 'SDMA राज्य',
    mr: 'SDMA राज्य',
  },
'DDMA District': {
    hi: 'DDMA ज़िला',
    mr: 'DDMA जिल्हा',
  },
'NDMA National': {
    hi: 'NDMA राष्ट्रीय',
    mr: 'NDMA राष्ट्रीय',
  },
'NDRF / SDRF': {
    hi: 'NDRF / SDRF',
    mr: 'NDRF / SDRF',
  },
'GSI / Field': {
    hi: 'GSI / फील्ड',
    mr: 'GSI / क्षेत्र',
  },
'Email address or ID': {
    hi: 'ईमेल पता या आईडी',
    mr: 'ईमेल पत्ता किंवा आयडी',
  },
'Password': {
    hi: 'पासवर्ड',
    mr: 'पासवर्ड',
  },
'Captcha': {
    hi: 'कैप्चा',
    mr: 'कॅप्चा',
  },
'Remember me': {
    hi: 'मुझे याद रखें',
    mr: 'माझी नोंद ठेवा',
  },
'Forgot password?': {
    hi: 'पासवर्ड भूल गए?',
    mr: 'पासवर्ड विसरलात?',
  },
'Citizen Quick Access (Public Portal)': {
    hi: 'नागरिक त्वरित प्रवेश (सार्वजनिक पोर्टल)',
    mr: 'नागरिक त्वरित प्रवेश (सार्वजनिक पोर्टल)',
  },
'Need assistance?': {
    hi: 'सहायता चाहिए?',
    mr: 'मदत हवी आहे का?',
  },
'Enter Public Safety Map': {
    hi: 'सार्वजनिक सुरक्षा मानचित्र खोलें',
    mr: 'सार्वजनिक सुरक्षा नकाशा उघडा',
  },
'Command Map': {
    hi: 'कमांड मैप',
    mr: 'कमांड नकाशा',
  },
'Alerts': {
    hi: 'अलर्ट (Alerts)',
    mr: 'इशारे व सूचना',
  },
'Red Zone Risk': {
    hi: 'रेड ज़ोन जोखिम',
    mr: 'रेड झोन जोखीम',
  },
'Safe Capacity': {
    hi: 'सुरक्षित क्षमता',
    mr: 'सुरक्षित धारण क्षमता',
  },
'Site Planner': {
    hi: 'स्थल योजनाकार',
    mr: 'जागा नियोजक',
  },
'Shelters & Supplies': {
    hi: 'आश्रय और सामग्री',
    mr: 'निवारा व साधनसामग्री',
  },
'Impact & Analytics': {
    hi: 'प्रभाव और विश्लेषण',
    mr: 'प्रभाव व विश्लेषण',
  },
'More Modules': {
    hi: 'अधिक मॉड्यूल',
    mr: 'इतर विभाग',
  },
'Synced': {
    hi: 'सिंक किया',
    mr: 'सिंक झाले',
  },
'Offline': {
    hi: 'ऑफ़लाइन',
    mr: 'ऑफलाईन',
  },
'Mock Drill': {
    hi: 'मॉक ड्रिल',
    mr: 'सराव मोहीम',
  },
'End Drill': {
    hi: 'ड्रिल समाप्त',
    mr: 'मोहीम थांबवा',
  },
'All Regions (Maharashtra)': {
    hi: 'सभी क्षेत्र (महाराष्ट्र)',
    mr: 'सर्व भाग (महाराष्ट्र)',
  },
'Raigad District': {
    hi: 'रायगढ़ ज़िला',
    mr: 'रायगड जिल्हा',
  },
'Pune District': {
    hi: 'पुणे ज़िला',
    mr: 'पुणे जिल्हा',
  },
'Ratnagiri District': {
    hi: 'रत्नागिरी ज़िला',
    mr: 'रत्नागिरी जिल्हा',
  },
'Satara District': {
    hi: 'सतारा ज़िला',
    mr: 'सातारा जिल्हा',
  },
'Kolhapur District': {
    hi: 'कोल्हापुर ज़िला',
    mr: 'कोल्हापूर जिल्हा',
  },
'Sindhudurg District': {
    hi: 'सिंधुदुर्ग ज़िला',
    mr: 'सिंधुदुर्ग जिल्हा',
  },
'Field / GIS (GSI)': {
    hi: 'फील्ड / जीआईएस (GSI)',
    mr: 'क्षेत्र / भूमाहिती (GSI)',
  },
'NDRF / Rescue': {
    hi: 'एनडीआरएफ / बचाव दल',
    mr: 'एनडीआरएफ / बचाव पथक',
  },
'Shelter & Volunteers': {
    hi: 'आश्रय एवं स्वयंसेवक',
    mr: 'निवारा व स्वयंसेवक',
  },
'Citizen': {
    hi: 'नागरिक',
    mr: 'नागरिक',
  },
'Disaster Resilience & Relocation': {
    hi: 'आपदा सुदृढ़ता एवं सुरक्षित पुनर्वास',
    mr: 'आपत्ती लवचिकता व सुरक्षित पुनर्वसन',
  },
'Disaster Resilience & Safe Relocation': {
    hi: 'आपदा सुदृढ़ता एवं सुरक्षित पुनर्वास',
    mr: 'आपत्ती लवचिकता व सुरक्षित पुनर्वसन',
  },
'Sign Out': {
    hi: 'लॉगआउट',
    mr: 'लॉगआउट',
  },
'Logout': {
    hi: 'लॉगआउट',
    mr: 'लॉगआउट',
  },
'Sign in': {
    hi: 'साइन इन करें',
    mr: 'साइन इन करा',
  },
'Sign In': {
    hi: 'साइन इन करें',
    mr: 'साइन इन करा',
  },
'or': {
    hi: 'या',
    mr: 'किंवा',
  },
'Refresh captcha': {
    hi: 'कैप्चा रिफ्रेश करें',
    mr: 'कॅप्चा रिफ्रेश करा',
  },
'Network Mode': {
    hi: 'नेटवर्क मोड',
    mr: 'नेटवर्क मोड',
  },
'Global Search (Ctrl+K)': {
    hi: 'ग्लोबल खोज (Ctrl+K)',
    mr: 'ग्लोबल शोध (Ctrl+K)',
  },
'Search...': {
    hi: 'खोजें...',
    mr: 'शोधा...',
  },
'Toggle theme': {
    hi: 'थीम बदलें',
    mr: 'थीम बदला',
  },
'High Contrast Mode': {
    hi: 'उच्च कंट्रास्ट मोड',
    mr: 'उच्च कॉन्ट्रास्ट मोड',
  },
'Live Synchronization': {
    hi: 'लाइव तुल्यकालन',
    mr: 'थेट समन्वय (सिंक)',
  },
'Simulated Offline': {
    hi: 'सिम्युलेटेड ऑफ़लाइन',
    mr: 'सिम्युलेटेड ऑफलाईन',
  },
'Toggle Navigation Menu': {
    hi: 'नेविगेशन मेनू टॉगल करें',
    mr: 'नेव्हिगेशन मेनू उघडा/बंद करा',
  },
'Current administrative area': {
    hi: 'वर्तमान प्रशासनिक क्षेत्र',
    mr: 'सध्याचा प्रशासकीय विभाग',
  },
'Switch active role': {
    hi: 'सक्रिय भूमिका बदलें',
    mr: 'सक्रिय भूमिका बदला',
  },
'NDMA · SDMA · DDMA': {
    hi: 'NDMA · SDMA · DDMA',
    mr: 'NDMA · SDMA · DDMA',
  },
'National Disaster Risk & Relocation Management System · Move people before the disaster, not after.': {
    hi: 'राष्ट्रीय आपदा जोखिम एवं पुनर्वास प्रबंधन प्रणाली · आपदा के बाद नहीं, आपदा से पहले लोगों को सुरक्षित करें।',
    mr: 'राष्ट्रीय आपत्ती धोका व पुनर्वसन व्यवस्थापन प्रणाली · आपत्तीनंतर नव्हे, आपत्तीपूर्वीच नागरिकांना सुरक्षित स्थळी हलवा.',
  },
'Online (Live)': {
    hi: 'ऑनलाइन (लाइव)',
    mr: 'ऑनलाईन (थेट)',
  },
'Offline Area Mode': {
    hi: 'ऑफ़लाइन क्षेत्र मोड',
    mr: 'ऑफलाईन क्षेत्र मोड',
  },
'Offline Mode': {
    hi: 'ऑफ़लाइन मोड',
    mr: 'ऑफलाईन मोड',
  },
  Online: {
    hi: 'ऑनलाइन',
    mr: 'ऑनलाईन',
  },
'High contrast': {
    hi: 'उच्च कंट्रास्ट',
    mr: 'उच्च कॉन्ट्रास्ट',
  },
'Public Advisories': {
    hi: 'सार्वजनिक चेतावनियाँ',
    mr: 'सार्वजनिक दक्षता सूचना',
  },
  Pause: {
    hi: 'रोकें',
    mr: 'थांबवा',
  },
  Resume: {
    hi: 'चालू करें',
    mr: 'पुन्हा सुरू करा',
  },
'Offline Area Mode Active — All 20 Modules & Vector GIS Working Without Internet': {
    hi: 'ऑफ़लाइन क्षेत्र मोड सक्रिय — सभी 20 मॉड्यूल एवं वेक्टर GIS बिना इंटरनेट के पूर्णतः कार्यरत',
    mr: 'ऑफलाईन क्षेत्र मोड सक्रिय — सर्व 20 मॉड्यूल्स आणि व्हेक्टर GIS इंटरनेटशिवाय पूर्णपणे कार्यरत',
  },
'Online Mode Active — Live Telemetry & Offline Area Cache Ready': {
    hi: 'ऑनलाइन मोड सक्रिय — लाइव टेलीमेट्री एवं ऑफ़लाइन क्षेत्र कैश तैयार',
    mr: 'ऑनलाईन मोड सक्रिय — थेट टेलीमेट्री आणि ऑफलाईन क्षेत्र डेटा कॅशे सज्ज',
  },
'Switch to Online Mode': {
    hi: 'ऑनलाइन मोड पर स्विच करें',
    mr: 'ऑनलाईन मोडवर जा',
  },
'Switch to Offline Area Mode': {
    hi: 'ऑफ़लाइन क्षेत्र मोड पर स्विच करें',
    mr: 'ऑफलाईन क्षेत्र मोडवर जा',
  },
'Save Offline Area Pack': {
    hi: 'ऑफ़लाइन क्षेत्र डेटा पैक सहेजें',
    mr: 'ऑफलाईन क्षेत्र डेटा पॅक जतन करा',
  },
'Refresh Offline Pack': {
    hi: 'ऑफ़लाइन पैक रिफ्रेश करें',
    mr: 'ऑफलाईन पॅक रिफ्रेश करा',
  },
'Public Safety & Emergency Operations': {
    hi: 'नागरिक सुरक्षा एवं आपातकालीन सेवाएँ',
    mr: 'नागरिक सुरक्षा आणि आपत्कालीन सेवा',
  },
'Immediate access without login — SOS dispatch, active advisories, area risk check, helplines and field hazard reporting': {
    hi: 'बिना लॉगिन तत्काल सुविधा — SOS संदेश, सक्रिय चेतावनियाँ, क्षेत्र जोखिम जाँच, हेल्पलाइन एवं आपदा रिपोर्टिंग',
    mr: 'लॉगिनशिवाय तात्काळ सुविधा — SOS संदेश, सक्रिय इशारे, क्षेत्र धोका तपासणी, हेल्पलाईन आणि आपत्ती नोंदणी',
  },
'Open Public Access': {
    hi: 'खुली सार्वजनिक सुविधा',
    mr: 'खुली सार्वजनिक सुविधा',
  },
'HOLD 3 SEC': {
    hi: '3 सेकंड दबाएँ',
    mr: '3 सेकंद दाबा',
  },
'Hold for 3 seconds to send SOS': {
    hi: 'SOS भेजने के लिए 3 सेकंड तक दबाए रखें',
    mr: 'SOS पाठवण्यासाठी 3 सेकंद दाबून ठेवा',
  },
'Or press and hold Space / Enter': {
    hi: 'या Space / Enter दबाए रखें',
    mr: 'किंवा Space / Enter दाबून ठेवा',
  },
'Emergency Distress & 112 Voice Line': {
    hi: 'आपातकालीन SOS एवं 112 हेल्पलाइन',
    mr: 'आपत्कालीन SOS आणि 112 हेल्पलाईन',
  },
'Transmits GPS coordinates and accuracy to State & District Control Rooms.': {
    hi: 'राज्य एवं जिला नियंत्रण कक्ष को GPS निर्देशांक और सटीकता तुरंत भेजता है।',
    mr: 'राज्य आणि जिल्हा नियंत्रण कक्षाला तात्काळ GPS स्थान व अचूकता पाठवते.',
  },
'Call 112': {
    hi: '112 पर कॉल करें',
    mr: '112 वर कॉल करा',
  },
'Call 112 Now': {
    hi: 'अभी 112 पर कॉल करें',
    mr: 'आताच 112 वर कॉल करा',
  },
'Queued. Call 112 now.': {
    hi: 'ऑफ़लाइन कतार में सहेजा गया। अभी 112 पर कॉल करें।',
    mr: 'ऑफलाईन रांगेत जतन केले. आताच 112 वर कॉल करा.',
  },
'Control room notified': {
    hi: 'नियंत्रण कक्ष को सूचित किया गया',
    mr: 'नियंत्रण कक्षाला सूचित केले',
  },
'Send update': {
    hi: 'अपडेट भेजें',
    mr: 'अपडेट पाठवा',
  },
'Call 1078 District Control': {
    hi: '1078 जिला नियंत्रण कक्ष',
    mr: '1078 जिल्हा नियंत्रण कक्ष',
  },
'Alerts near me': {
    hi: 'मेरे पास की चेतावनियाँ',
    mr: 'माझ्या जवळील इशारे',
  },
'Check My Area': {
    hi: 'मेरे क्षेत्र का जोखिम जाँचें',
    mr: 'माझ्या भागाचा धोका तपासा',
  },
'Use my location': {
    hi: 'मेरा GPS स्थान लें',
    mr: 'माझे GPS स्थान वापरा',
  },
'Rainfall last 24 h': {
    hi: 'पिछले 24 घंटे की वर्षा',
    mr: 'मागील 24 तासांतील पाऊस',
  },
'Forecast next 24 h': {
    hi: 'अगले 24 घंटे का पूर्वानुमान',
    mr: 'पुढील 24 तासांचा अंदाज',
  },
'Open hazard guidance & evacuation route →': {
    hi: 'सुरक्षा दिशानिर्देश एवं निकासी मार्ग खोलें →',
    mr: 'सुरक्षा मार्गदर्शन आणि स्थलांतर मार्ग पहा →',
  },
'24×7 Emergency Helplines (Tap to Call)': {
    hi: '24×7 आपातकालीन हेल्पलाइन (कॉल करने हेतु टैप करें)',
    mr: '24×7 आपत्कालीन हेल्पलाईन (कॉल करण्यासाठी टॅप करा)',
  },
'Report a Hazard (No login required)': {
    hi: 'आपदा / खतरे की रिपोर्ट करें (लॉगिन आवश्यक नहीं)',
    mr: 'आपत्ती / धोक्याची नोंद करा (लॉगिन आवश्यक नाही)',
  },
'Submit ground cracks, slope seepage, tilting structures or road blockages directly to the Field Officer verification queue.': {
    hi: 'ज़मीन में दरारें, ढलान से रिसाव, झुकते मकान या सड़क अवरोध सीधे फील्ड अधिकारी सत्यापन कतार में भेजें।',
    mr: 'जमिनीतील भेगा, उतारावरील पाझर, झुकलेली घरे किंवा रस्ता अडथळे थेट क्षेत्रीय अधिकारी पडताळणीसाठी पाठवा.',
  },
'GPS Auto-Tagged': {
    hi: 'GPS स्वतः टैग',
    mr: 'GPS ऑटो-टॅग',
  },
'Habitation / Location': {
    hi: 'बस्ती / स्थान',
    mr: 'वस्ती / ठिकाण',
  },
'Hazard Category': {
    hi: 'आपदा श्रेणी',
    mr: 'आपत्ती प्रकार',
  },
'Field Photo': {
    hi: 'फील्ड फोटो',
    mr: 'प्रत्यक्ष फोटो',
  },
'Attach photo evidence': {
    hi: 'फोटो प्रमाण जोड़ें',
    mr: 'फोटो पुरावा जोडा',
  },
'Submit Report': {
    hi: 'रिपोर्ट भेजें',
    mr: 'अहवाल पाठवा',
  },
'Organisation Access': {
    hi: 'संगठन एवं अधिकारी लॉगिन',
    mr: 'संस्था व अधिकारी लॉगिन',
  },
'RBAC · 2FA Enabled': {
    hi: 'RBAC · 2FA सुरक्षित',
    mr: 'RBAC · 2FA सुरक्षित',
  },
'Select your authority or partner category to sign in to the operations workspace. Works both online and in offline field areas.': {
    hi: 'ऑपरेशंस वर्कस्पेस में लॉगिन करने के लिए अपना प्राधिकरण या श्रेणी चुनें। यह ऑनलाइन और ऑफ़लाइन दोनों क्षेत्रों में काम करता है।',
    mr: 'ऑपरेशन्स वर्कस्पेसमध्ये प्रवेश करण्यासाठी आपले प्राधिकरण किंवा श्रेणी निवडा. हे ऑनलाईन आणि ऑफलाईन दोन्ही क्षेत्रांत कार्य करते.',
  },
'National (NDMA)': {
    hi: 'राष्ट्रीय (NDMA)',
    mr: 'राष्ट्रीय (NDMA)',
  },
'State (SDMA)': {
    hi: 'राज्य (SDMA)',
    mr: 'राज्य (SDMA)',
  },
'District (DDMA)': {
    hi: 'जिला (DDMA)',
    mr: 'जिल्हा (DDMA)',
  },
'Response Forces': {
    hi: 'बचाव बल (NDRF/SDRF)',
    mr: 'बचाव दल (NDRF/SDRF)',
  },
  Departments: {
    hi: 'सरकारी विभाग',
    mr: 'शासकीय विभाग',
  },
'Relief Partners': {
    hi: 'राहत सहयोगी संस्था',
    mr: 'मदत भागीदार संस्था',
  },
'National Authority': {
    hi: 'राष्ट्रीय आपदा प्रबंधन प्राधिकरण (NDMA)',
    mr: 'राष्ट्रीय आपत्ती व्यवस्थापन प्राधिकरण (NDMA)',
  },
'State Authority': {
    hi: 'राज्य आपदा प्रबंधन प्राधिकरण (SDMA)',
    mr: 'राज्य आपत्ती व्यवस्थापन प्राधिकरण (SDMA)',
  },
'District Authority': {
    hi: 'जिला आपदा प्रबंधन प्राधिकरण (DDMA)',
    mr: 'जिल्हा आपत्ती व्यवस्थापन प्राधिकरण (DDMA)',
  },
'Government Departments and Agencies': {
    hi: 'सरकारी विभाग एवं तकनीकी एजेंसियाँ',
    mr: 'शासकीय विभाग आणि तांत्रिक संस्था',
  },
'Relief and Partner Organisations': {
    hi: 'राहत एवं सहयोगी संगठन (Red Cross / NGO)',
    mr: 'मदत आणि भागीदार संस्था (Red Cross / NGO)',
  },
'State / Jurisdiction': {
    hi: 'राज्य / कार्यक्षेत्र',
    mr: 'राज्य / कार्यक्षेत्र',
  },
'District / Sector': {
    hi: 'जिला / सेक्टर',
    mr: 'जिल्हा / सेक्टर',
  },
'Operational Unit / Division': {
    hi: 'संचालन इकाई / प्रभाग',
    mr: 'कार्यान्वयन युनिट / विभाग',
  },
'Organisation Code': {
    hi: 'संगठन कोड',
    mr: 'संस्था कोड',
  },
'Official ID or Email': {
    hi: 'आधिकारिक आईडी या ईमेल',
    mr: 'अधिकृत आयडी किंवा ईमेल',
  },
'6-Digit Authenticator Code': {
    hi: '6-अंकीय प्रमाणक कोड (2FA)',
    mr: '6-अंकी ऑथेंटिकेटर कोड (2FA)',
  },
'Keep me signed in on this workstation (8-hour shift)': {
    hi: 'इस वर्कस्टेशन पर लॉगिन बनाए रखें (8-घंटे की शिफ्ट)',
    mr: 'या टर्मिनलवर लॉगिन चालू ठेवा (8-तासांची शिफ्ट)',
  },
'Sign in to Nivaran Workspace': {
    hi: 'निवारण कमांड वर्कस्पेस में लॉगिन करें',
    mr: 'निवारण कमांड वर्कस्पेसमध्ये लॉगिन करा',
  },
'Continue as Public Citizen (No login required)': {
    hi: 'नागरिक पोर्टल में सीधे प्रवेश करें (लॉगिन आवश्यक नहीं)',
    mr: 'नागरिक पोर्टलमध्ये थेट प्रवेश करा (लॉगिन आवश्यक नाही)',
  },
'Developer & Evaluator Quick Access (7 Pre-Filled Organisation Profiles)': {
    hi: 'त्वरित परीक्षण लॉगिन (7 पूर्व-निर्मित संगठन प्रोफ़ाइल)',
    mr: 'त्वरित चाचणी लॉगिन (7 पूर्व-निर्मित संस्था प्रोफाईल)',
  },
'National Spatial Decision Support & Incident Command Platform': {
    hi: 'राष्ट्रीय स्थानिक निर्णय समर्थन एवं आपदा कमांड प्लेटफॉर्म',
    mr: 'राष्ट्रीय स्थानिक निर्णय समर्थन आणि आपत्ती नियंत्रण प्रणाली',
  },
'Pre-monsoon multi-hazard Red Zone delineation, live hydrometeorological and seismic telemetry, carrying-capacity verification of host plateaus, and incident command across vulnerable districts.': {
    hi: 'मानसून-पूर्व बहु-आपदा रेड-ज़ोन निर्धारण, लाइव मौसम एवं भूकंपीय टेलीमेट्री, पुनर्वास पठारों की धारण-क्षमता सत्यापन और संवेदनशील जिलों में आपदा कमांड।',
    mr: 'मान्सूनपूर्व बहु-आपत्ती रेड-झोन निश्चिती, थेट हवामान व भूकंपीय टेलीमेट्री, पुनर्वसन पठारांची धारण-क्षमता पडताळणी आणि संवेदनशील जिल्ह्यांचे नियंत्रण.',
  },
'ISRO CartoDEM slope + GSI landslide inventory + live Open-Meteo & IMD rainfall': {
    hi: 'ISRO CartoDEM ढलान + GSI भूस्खलन डेटा + लाइव Open-Meteo एवं IMD वर्षा',
    mr: 'ISRO CartoDEM उतार + GSI भूस्खलन नोंद + थेट Open-Meteo आणि IMD पर्जन्यमान',
  },
'SPHERE & NDMA land/water/road capacity checks before household matching': {
    hi: 'परिवार आवंटन से पूर्व SPHERE एवं NDMA भूमि/जल/सड़क क्षमता जांच',
    mr: 'कुटुंब वाटपापूर्वी SPHERE आणि NDMA जमीन/पाणी/रस्ता क्षमता तपासणी',
  },
'CAP-compliant public alerts, NDRF/SDRF dispatch & SHA-256 audit ledger': {
    hi: 'CAP-मानक सार्वजनिक अलर्ट, NDRF/SDRF तैनाती एवं SHA-256 ऑडिट लेजर',
    mr: 'CAP-मानक सार्वजनिक इशारे, NDRF/SDRF तैनाती व SHA-256 ऑडिट लेजर',
  },
'Select your operational role to access authorized disaster management modules.': {
    hi: 'अधिकृत आपदा प्रबंधन मॉड्यूल तक पहुँचने के लिए अपनी संचालन भूमिका चुनें।',
    mr: 'अधिकृत आपत्ती व्यवस्थापन मॉड्यूल्स वापरण्यासाठी आपली भूमिका निवडा.',
  },
'NDMA / SDMA Command': {
    hi: 'NDMA / SDMA कमांड',
    mr: 'NDMA / SDMA नियंत्रण',
  },
'DDMA / Collectorate': {
    hi: 'DDMA / जिलाधिकारी कार्यालय',
    mr: 'DDMA / जिल्हाधिकारी कार्यालय',
  },
'Tehsildar / Engineer': {
    hi: 'तहसीलदार / अभियंता',
    mr: 'तहसीलदार / अभियंता',
  },
'NDRF / SDRF / Fire': {
    hi: 'NDRF / SDRF / अग्निशमन',
    mr: 'NDRF / SDRF / अग्निशमन',
  },
'Public Safety & SOS': {
    hi: 'नागरिक सुरक्षा एवं SOS',
    mr: 'नागरिक सुरक्षा व SOS',
  },
'Official Email / Employee ID': {
    hi: 'आधिकारिक ईमेल / कर्मचारी आईडी',
    mr: 'अधिकृत ईमेल / कर्मचारी आयडी',
  },
'Mobile Number (10-digit)': {
    hi: 'मोबाइल नंबर (10 अंक)',
    mr: 'मोबाईल क्रमांक (10 अंकी)',
  },
'One-Time Password (OTP)': {
    hi: 'वन-टाइम पासवर्ड (OTP)',
    mr: 'वन-टाइम पासवर्ड (OTP)',
  },
'Resend SMS OTP': {
    hi: 'SMS OTP पुनः भेजें',
    mr: 'SMS OTP पुन्हा पाठवा',
  },
'Keep session active on this terminal': {
    hi: 'इस टर्मिनल पर सत्र सक्रिय रखें',
    mr: 'या टर्मिनलवर सत्र सक्रिय ठेवा',
  },
'Verifying Credentials...': {
    hi: 'प्रमाणीकरण की जाँच हो रही है...',
    mr: 'ओळख पटवली जात आहे...',
  },
// AppLayout & Top Bar
  India: {
    hi: 'भारत',
    mr: 'भारत',
  },
  Maharashtra: {
    hi: 'महाराष्ट्र',
    mr: 'महाराष्ट्र',
  },
'All Western Ghats Districts': {
    hi: 'सभी पश्चिमी घाट जिले',
    mr: 'सर्व पश्चिम घाट जिल्हे',
  },
'All Districts': {
    hi: 'सभी जिले',
    mr: 'सर्व जिल्हे',
  },
'Active Command Role': {
    hi: 'सक्रिय कमांड भूमिका',
    mr: 'सक्रिय नियंत्रण भूमिका',
  },
  Exit: {
    hi: 'बाहर',
    mr: 'बाहेर',
  },
'Session Inactivity Warning': {
    hi: 'सत्र निष्क्रियता चेतावनी',
    mr: 'सत्र निष्क्रियता सूचना',
  },
'Stay Signed In': {
    hi: 'लॉगिन बनाए रखें',
    mr: 'लॉगिन चालू ठेवा',
  },
'Sign out': {
    hi: 'लॉग आउट',
    mr: 'बाहेर पडा',
  },
// Command Dashboard Page
  'National → State → District → Village Operational Command': {
    hi: 'राष्ट्रीय → राज्य → जिला → ग्राम संचालन कमांड',
    mr: 'राष्ट्रीय → राज्य → जिल्हा → गाव नियंत्रण कक्ष',
  },
'State Emergency Operations & Relocation Command Center': {
    hi: 'राज्य आपातकालीन संचालन एवं पुनर्वास कमांड सेंटर',
    mr: 'राज्य आपत्कालीन संचालन व पुनर्वसन नियंत्रण कक्ष',
  },
'All Districts (6)': {
    hi: 'सभी जिले (6)',
    mr: 'सर्व जिल्हे (6)',
  },
'Raigad DDMA': {
    hi: 'रायगड DDMA',
    mr: 'रायगड DDMA',
  },
'Ratnagiri DDMA': {
    hi: 'रत्नागिरी DDMA',
    mr: 'रत्नागिरी DDMA',
  },
'Pune DDMA': {
    hi: 'पुणे DDMA',
    mr: 'पुणे DDMA',
  },
'Satara DDMA': {
    hi: 'सातारा DDMA',
    mr: 'सातारा DDMA',
  },
'Kolhapur DDMA': {
    hi: 'कोल्हापुर DDMA',
    mr: 'कोल्हापूर DDMA',
  },
'Sindhudurg DDMA': {
    hi: 'सिंधुदुर्ग DDMA',
    mr: 'सिंधुदुर्ग DDMA',
  },
'Full GIS Engine': {
    hi: 'पूर्ण GIS इंजन',
    mr: 'पूर्ण GIS प्रणाली',
  },
'Syncing...': {
    hi: 'सिंक हो रहा है...',
    mr: 'सिंक होत आहे...',
  },
'Red Zone Habitations': {
    hi: 'रेड-ज़ोन बस्तियाँ',
    mr: 'रेड-झोन वस्त्या',
  },
'Immediate Relocation (>0.75)': {
    hi: 'तत्काल पुनर्वास (>0.75)',
    mr: 'तात्काळ पुनर्वसन (>0.75)',
  },
'Households at Risk': {
    hi: 'जोखिमग्रस्त परिवार',
    mr: 'धोक्यातील कुटुंबे',
  },
'In Immediate Red Zones': {
    hi: 'तत्काल रेड-ज़ोन में',
    mr: 'तात्काळ रेड-झोनमध्ये',
  },
'Active Incidents': {
    hi: 'सक्रिय आपदा घटनाएँ',
    mr: 'सक्रिय आपत्ती घटना',
  },
'NDRF / SDRF Triage Active': {
    hi: 'NDRF / SDRF बचाव सक्रिय',
    mr: 'NDRF / SDRF बचाव कार्य सुरू',
  },
'Available Safe Capacity': {
    hi: 'उपलब्ध सुरक्षित क्षमता',
    mr: 'उपलब्ध सुरक्षित क्षमता',
  },
'Across 12 Verified Host Sites': {
    hi: '12 सत्यापित पुनर्वास स्थलों में',
    mr: '12 पडताळणी केलेल्या पुनर्वसन स्थळांवर',
  },
'Relocation Progress': {
    hi: 'पुनर्वास प्रगति',
    mr: 'पुनर्वसन प्रगती',
  },
'Pending Verification': {
    hi: 'लंबित क्षेत्रीय सत्यापन',
    mr: 'प्रलंबित क्षेत्रीय पडताळणी',
  },
'Active IMD Warnings': {
    hi: 'सक्रिय IMD चेतावनियाँ',
    mr: 'सक्रिय IMD इशारे',
  },
'Red / Orange District Alerts': {
    hi: 'लाल / नारंगी जिला अलर्ट',
    mr: 'रेड / ऑरेंज जिल्हा इशारे',
  },
'Interactive Spatial Command Map': {
    hi: 'इंटरैक्टिव स्थानिक कमांड मानचित्र',
    mr: 'इंटरॅक्टिव्ह स्थानिक नियंत्रण नकाशा',
  },
'Click any habitation cell or shelter to inspect scores, elevation, and evacuation corridors': {
    hi: 'स्कोर, ऊँचाई और निकासी मार्ग देखने के लिए किसी भी बस्ती या आश्रय शिविर पर क्लिक करें',
    mr: 'स्कोअर, उंची आणि स्थलांतर मार्ग पाहण्यासाठी कोणत्याही वस्ती किंवा निवारा केंद्रावर क्लिक करा',
  },
'Open What-If Simulator': {
    hi: 'सिम्युलेटर खोलें',
    mr: 'सिम्युलेटर उघडा',
  },
'Top Priority Relocation Queue': {
    hi: 'शीर्ष प्राथमिकता पुनर्वास सूची',
    mr: 'अग्रक्रम पुनर्वसन यादी',
  },
'Priority = Hazard × Vulnerability': {
    hi: 'प्राथमिकता = आपदा जोखिम × संवेदनशीलता',
    mr: 'प्राधान्य = आपत्ती धोका × संवेदनशीलता',
  },
'Full Table': {
    hi: 'पूरी तालिका',
    mr: 'संपूर्ण तक्ता',
  },
'Selected Habitation Profile': {
    hi: 'चयनित बस्ती प्रोफ़ाइल',
    mr: 'निवडलेल्या वस्तीची माहिती',
  },
  Slope: {
    hi: 'ढलान (Slope)',
    mr: 'उतार (Slope)',
  },
  Elevation: {
    hi: 'ऊँचाई (ASL)',
    mr: 'उंची (ASL)',
  },
  Households: {
    hi: 'परिवार',
    mr: 'कुटुंबे',
  },
'Explain Score': {
    hi: 'स्कोर समझें',
    mr: 'स्कोअर स्पष्टीकरण',
  },
'Inspect on GIS': {
    hi: 'GIS पर देखें',
    mr: 'GIS नकाशावर पहा',
  },
'Live Operations, Incident Dispatch & CAP Broadcast Feed': {
    hi: 'लाइव संचालन, घटना तैनाती एवं CAP प्रसारण फ़ीड',
    mr: 'थेट कार्यवाही, घटना प्रतिसाद आणि CAP पूर्वसूचना फीड',
  },
'View All Incidents →': {
    hi: 'सभी घटनाएँ देखें →',
    mr: 'सर्व घटना पहा →',
  },
// GIS Workspace & Map Controls
  'National GIS Command & Spatial Analysis Engine': {
    hi: 'राष्ट्रीय GIS कमांड एवं स्थानिक विश्लेषण इंजन',
    mr: 'राष्ट्रीय GIS नियंत्रण व स्थानिक विश्लेषण प्रणाली',
  },
'Turf.js Spatial Buffering · Polygon AOI Query · Live Open-Meteo Elevation & Weather · OSRM Evacuation Routing': {
    hi: 'Turf.js स्थानिक बफरिंग · बहुभुज AOI विश्लेषण · लाइव Open-Meteo ऊँचाई व मौसम · OSRM निकासी मार्ग',
    mr: 'Turf.js स्थानिक बफरिंग · बहुभुज AOI विश्लेषण · थेट Open-Meteo उंची व हवामान · OSRM स्थलांतर मार्ग',
  },
'Export GeoJSON': {
    hi: 'GeoJSON निर्यात करें',
    mr: 'GeoJSON निर्यात करा',
  },
'Print PDF Map Sheet': {
    hi: 'PDF मानचित्र शीट डाउनलोड करें',
    mr: 'PDF नकाशा प्रत डाउनलोड करा',
  },
'Turf.js AOI Spatial Analysis': {
    hi: 'Turf.js AOI स्थानिक विश्लेषण',
    mr: 'Turf.js AOI स्थानिक विश्लेषण',
  },
'Draw Polygon on Map': {
    hi: 'मानचित्र पर क्षेत्र (Polygon) बनाएँ',
    mr: 'नकाशावर क्षेत्र (Polygon) काढा',
  },
'Stop Drawing': {
    hi: 'ड्राइंग रोकें',
    mr: 'आरेखन थांबवा',
  },
'Reset to Default Buffer': {
    hi: 'डिफ़ॉल्ट बफर रीसेट करें',
    mr: 'डिफॉल्ट बफर पूर्ववत करा',
  },
'Polygon Area': {
    hi: 'क्षेत्रफल (Area)',
    mr: 'क्षेत्रफळ (Area)',
  },
'Habitations Inside': {
    hi: 'अंदर स्थित बस्तियाँ',
    mr: 'क्षेत्रातील वस्त्या',
  },
'Households at Risk Inside': {
    hi: 'क्षेत्र के भीतर परिवार',
    mr: 'क्षेत्रातील कुटुंबे',
  },
'Vulnerable Citizens': {
    hi: 'अति-संवेदनशील नागरिक',
    mr: 'अति-संवेदनशील नागरिक',
  },
'Elderly, Disabled & Under-5': {
    hi: 'बुजुर्ग, दिव्यांग एवं 5 वर्ष से कम',
    mr: 'वृद्ध, दिव्यांग आणि ५ वर्षांखालील',
  },
'Save AOI': {
    hi: 'AOI सहेजें',
    mr: 'AOI जतन करा',
  },
'Open-Meteo Live Telemetry': {
    hi: 'Open-Meteo लाइव टेलीमेट्री',
    mr: 'Open-Meteo थेट टेलीमेट्री',
  },
'24h Rain': {
    hi: '24 घंटे वर्षा',
    mr: '24 तास पाऊस',
  },
  Wind: {
    hi: 'हवा की गति',
    mr: 'वाऱ्याचा वेग',
  },
'IMD Alert': {
    hi: 'IMD चेतावनी',
    mr: 'IMD इशारा',
  },
'One-Tap Evacuation Route': {
    hi: 'एक-क्लिक सुरक्षित निकासी मार्ग',
    mr: 'एक-क्लिक सुरक्षित स्थलांतर मार्ग',
  },
'Locate Me (Live GPS)': {
    hi: 'मेरी लाइव GPS लोकेशन',
    mr: 'माझे थेट GPS स्थान',
  },
'Simulate Red-Zone Walk': {
    hi: 'रेड-ज़ोन प्रवेश सिम्युलेट करें',
    mr: 'रेड-झोन प्रवेश सिम्युलेट करा',
  },
  Inspect: {
    hi: 'निरीक्षण करें',
    mr: 'तपासा',
  },
  Explain: {
    hi: 'समझें',
    mr: 'स्पष्टीकरण',
  },
'Route to Shelter': {
    hi: 'आश्रय शिविर मार्ग',
    mr: 'निवारा केंद्र मार्ग',
  },
'Open Incident Command': {
    hi: 'घटना कमांड खोलें',
    mr: 'घटना नियंत्रण उघडा',
  },
// Hazard Map Page
  'Live Multi-Hazard Red Zone Mapping & Weight Calibration': {
    hi: 'लाइव बहु-आपदा रेड-ज़ोन मानचित्रण एवं भार (Weight) अंशांकन',
    mr: 'थेट बहु-आपत्ती रेड-झोन नकाशा आणि भार (Weight) समायोजन',
  },
'Satellite Change-Detection Demo — Irshalwadi Escarpment': {
    hi: 'उपग्रह परिवर्तन-पहचान (Change-Detection) — इरशाळवाडी ढलान',
    mr: 'उपग्रह बदल-तपासणी (Change-Detection) — इरशाळवाडी कडा',
  },
'Drag slider to compare Pre-Monsoon Baseline vs Latest Cartosat-3 Pass': {
    hi: 'मानसून-पूर्व बेसलाइन बनाम नवीनतम Cartosat-3 उपग्रह चित्र की तुलना करने के लिए स्लाइडर खींचें',
    mr: 'मान्सूनपूर्व स्थिती आणि नवीनतम Cartosat-3 उपग्रह चित्राची तुलना करण्यासाठी स्लायडर सरकवा',
  },
'Interactive Factor Weight Sliders': {
    hi: 'इंटरैक्टिव आपदा कारक भार (Weight) स्लाइडर',
    mr: 'इंटरॅक्टिव्ह आपत्ती घटक भार (Weight) स्लायडर',
  },
'Reset Default (35/30/20/15)': {
    hi: 'डिफ़ॉल्ट रीसेट करें (35/30/20/15)',
    mr: 'डिफॉल्ट पूर्ववत करा (35/30/20/15)',
  },
'Climate Change Projection Horizon': {
    hi: 'जलवायु परिवर्तन प्रक्षेपण क्षितिज',
    mr: 'हवामान बदल प्रक्षेपण कालावधी',
  },
// Vulnerability Page
  'Socio-Economic Vulnerability Index & 2×2 Action Matrix': {
    hi: 'सामाजिक-आर्थिक संवेदनशीलता सूचकांक एवं 2×2 निर्णय मैट्रिक्स',
    mr: 'सामाजिक-आर्थिक संवेदनशीलता निर्देशांक आणि 2×2 कृती मॅट्रिक्स',
  },
'Hazard vs Vulnerability 2×2 Action Matrix': {
    hi: 'आपदा जोखिम बनाम संवेदनशीलता 2×2 निर्णय मैट्रिक्स',
    mr: 'आपत्ती धोका विरुद्ध संवेदनशीलता 2×2 कृती मॅट्रिक्स',
  },
'5-Axis Vulnerability Radar Profile': {
    hi: '5-आयामी संवेदनशीलता रडार प्रोफ़ाइल',
    mr: '5-आयामी संवेदनशीलता रडार प्रोफाईल',
  },
'Complete Village Vulnerability Register': {
    hi: 'संपूर्ण ग्राम संवेदनशीलता रजिस्टर',
    mr: 'संपूर्ण गाव संवेदनशीलता नोंदवही',
  },
// Site Suitability Page
  'Site Suitability (MCDA) & Carrying Capacity Verification': {
    hi: 'पुनर्वास स्थल उपयुक्तता (MCDA) एवं धारण-क्षमता सत्यापन',
    mr: 'पुनर्वसन जागा योग्यता (MCDA) आणि धारण-क्षमता पडताळणी',
  },
'Run Digital Dress Rehearsal on All 8 Sites': {
    hi: 'सभी स्थलों पर डिजिटल ड्रेस रिहर्सल (सुरक्षा जाँच) चलाएँ',
    mr: 'सर्व स्थळांवर डिजिटल सुरक्षा चाचणी (Dress Rehearsal) चालवा',
  },
'GREEN — Ample Safe Capacity': {
    hi: 'हरा — पर्याप्त सुरक्षित क्षमता उपलब्ध',
    mr: 'हिरवा — पुरेशी सुरक्षित क्षमता उपलब्ध',
  },
'YELLOW — Moderate Capacity Left': {
    hi: 'पीला — मध्यम क्षमता शेष',
    mr: 'पिवळा — मध्यम क्षमता शिल्लक',
  },
'RED — Near Full Capacity': {
    hi: 'लाल — क्षमता लगभग पूर्ण',
    mr: 'लाल — क्षमता जवळपास पूर्ण',
  },
// Priority Ranking & Relocation Planner Page
  'Explainable Priority Relocation Planner & Greedy Site Allocation': {
    hi: 'पारदर्शी प्राथमिकता पुनर्वास योजना एवं स्थल आवंटन',
    mr: 'स्पष्टीकरणासह प्राधान्य पुनर्वसन आराखडा आणि जागा वाटप',
  },
'Export CSV': {
    hi: 'CSV निर्यात करें',
    mr: 'CSV निर्यात करा',
  },
'Download Official PDF Order': {
    hi: 'आधिकारिक PDF आदेश डाउनलोड करें',
    mr: 'अधिकृत PDF आदेश डाउनलोड करा',
  },
'Approve Official Relocation Plan': {
    hi: 'आधिकारिक पुनर्वास योजना स्वीकृत करें',
    mr: 'अधिकृत पुनर्वसन आराखडा मंजूर करा',
  },
'Plan Approved & Locked': {
    hi: 'योजना स्वीकृत एवं लॉक की गई',
    mr: 'आराखडा मंजूर आणि लॉक केला',
  },
// Simulator Page
  'What-If Engineering Mitigation & Cloudburst Stress Simulator': {
    hi: 'इंजीनियरिंग न्यूनीकरण एवं बादल-फटने (Cloudburst) का स्ट्रेस सिम्युलेटर',
    mr: 'अभियांत्रिकी उपाययोजना आणि ढगफुटी (Cloudburst) स्ट्रेस सिम्युलेटर',
  },
'Test whether engineering interventions (check dams, retaining walls, drainage) can bring a village out of the Red/Orange zone, or if permanent relocation is mandatory.': {
    hi: 'जाँच करें कि क्या इंजीनियरिंग उपाय (चेक डैम, रिटेनिंग वॉल, ड्रेनेज) गाँव को रेड/ऑरेंज ज़ोन से बाहर ला सकते हैं, या स्थायी पुनर्वास अनिवार्य है।',
    mr: 'अभियांत्रिकी उपाययोजनांमुळे (चेक डॅम, संरक्षक भिंत, निचरा) गाव रेड/ऑरेंज झोनमधून बाहेर येऊ शकते का, की कायमस्वरूपी पुनर्वसन अनिवार्य आहे हे तपासा.',
  },
// Early Warning Page
  'Early Warning Telemetry, CAP Broadcast & Evacuation Command': {
    hi: 'पूर्व चेतावनी टेलीमेट्री, CAP प्रसारण एवं निकासी कमांड',
    mr: 'पूर्वसूचना टेलीमेट्री, CAP प्रसारण आणि स्थलांतर नियंत्रण',
  },
'Real-time IoT rain gauges, pore-water soil moisture probes, MEMS slope inclinometers, CWC river stages, and Sachet-style Common Alerting Protocol (CAP) dispatch.': {
    hi: 'रियल-टाइम IoT वर्षा मापी, मिट्टी नमी सेंसर, ढलान झुकाव सेंसर, CWC नदी जलस्तर और सचेत (SACHET) CAP सार्वजनिक अलर्ट प्रसारण।',
    mr: 'रिअल-टाइम IoT पर्जन्यमापक, माती ओलावा सेन्सर, उतार सेन्सर, CWC नदी पातळी आणि सचेत (SACHET) CAP सार्वजनिक इशारा प्रसारण.',
  },
'Compose CAP Public Alert': {
    hi: 'नया CAP सार्वजनिक अलर्ट बनाएँ',
    mr: 'नवीन CAP सार्वजनिक इशारा तयार करा',
  },
'Pause Sensor Stream': {
    hi: 'सेंसर स्ट्रीम रोकें',
    mr: 'सेन्सर प्रवाह थांबवा',
  },
'Resume Sensor Stream': {
    hi: 'सेंसर स्ट्रीम चालू करें',
    mr: 'सेन्सर प्रवाह सुरू करा',
  },
'Simulate Threshold Breach': {
    hi: 'थ्रेशोल्ड उल्लंघन (खतरा) सिम्युलेट करें',
    mr: 'धोका पातळी ओलांडणे सिम्युलेट करा',
  },
'Broadcast CAP Alert': {
    hi: 'CAP अलर्ट प्रसारित करें',
    mr: 'CAP इशारा प्रसारित करा',
  },
// Incident Management Page
  'SEOC / DEOC Incident Command & Triage System': {
    hi: 'SEOC / DEOC आपदा घटना कमांड एवं ट्रायज प्रणाली',
    mr: 'SEOC / DEOC आपत्ती घटना नियंत्रण व प्राधान्य प्रणाली',
  },
'Active Disaster Incidents, Response Dispatch & SLA Tracker': {
    hi: 'सक्रिय आपदा घटनाएँ, बचाव दल तैनाती एवं SLA ट्रैकर',
    mr: 'सक्रिय आपत्ती घटना, बचाव पथक तैनाती आणि SLA ट्रॅकर',
  },
'Log New Field Incident': {
    hi: 'नई आपदा घटना दर्ज करें',
    mr: 'नवीन आपत्ती घटना नोंदवा',
  },
// Resource Management Page
  'Emergency Shelters, Relief Camps & Disaster Resource Inventory': {
    hi: 'आपातकालीन आश्रय, राहत शिविर एवं आपदा संसाधन सूची',
    mr: 'आपत्कालीन निवारा केंद्रे, मदत शिबिरे आणि साधनसामग्री साठा',
  },
// Relocation Tracker Page
  'Digital Relocation Lifecycle Tracker & Tamper-Proof Audit Ledger': {
    hi: 'डिजिटल पुनर्वास जीवनचक्र ट्रैकर एवं छेड़छाड़-रोधी (SHA-256) लेजर',
    mr: 'डिजिटल पुनर्वसन ट्रॅकर आणि सुरक्षित (SHA-256) ऑडिट लेजर',
  },
'Digital Relocation Case Tracker & Tamper-Proof Audit Ledger': {
    hi: 'डिजिटल पुनर्वास केस ट्रैकर एवं छेड़छाड़-रोधी (SHA-256) ऑडिट लेजर',
    mr: 'डिजिटल पुनर्वसन केस ट्रॅकर आणि सुरक्षित (SHA-256) ऑडिट लेजर',
  },
'Verify Ledger Hash Chain': {
    hi: 'लेजर हैश-चेन सत्यापित करें',
    mr: 'लेजर हॅश-चेन तपासा',
  },
  Kanban: {
    hi: 'कैनबैन बोर्ड',
    mr: 'कॅनबॅन बोर्ड',
  },
  Table: {
    hi: 'तालिका (Table)',
    mr: 'तक्ता (Table)',
  },
// Community Reports Page
  'Community Hazard Reporting & Field Officer Verification Queue': {
    hi: 'सामुदायिक आपदा रिपोर्टिंग एवं फील्ड अधिकारी सत्यापन कतार',
    mr: 'ग्रामस्थ आपत्ती तक्रार नोंदणी आणि क्षेत्रीय अधिकारी पडताळणी यादी',
  },
'Community Hazard Reporting App & Field Officer Verification Queue': {
    hi: 'सामुदायिक आपदा रिपोर्टिंग ऐप एवं फील्ड अधिकारी सत्यापन कतार',
    mr: 'ग्रामस्थ आपत्ती तक्रार नोंदणी आणि क्षेत्रीय अधिकारी पडताळणी यादी',
  },
// Citizen Safety Portal Page
  'Citizen Safety, Early Warning & Emergency SOS Portal': {
    hi: 'नागरिक सुरक्षा, पूर्व चेतावनी एवं आपातकालीन SOS पोर्टल',
    mr: 'नागरिक सुरक्षा, पूर्वसूचना आणि आपत्कालीन SOS पोर्टल',
  },
'Am I in a Hazard Red Zone?': {
    hi: 'क्या मैं आपदा रेड-ज़ोन में हूँ?',
    mr: 'मी आपत्ती रेड-झोनमध्ये आहे का?',
  },
'Nearest Safe Relief Shelters': {
    hi: 'निकटतम सुरक्षित राहत शिविर',
    mr: 'जवळची सुरक्षित निवारा केंद्रे',
  },
'Emergency Helplines (24×7 Toll-Free)': {
    hi: 'आपातकालीन हेल्पलाइन (24×7 टोल-फ्री)',
    mr: 'आपत्कालीन हेल्पलाईन (24×7 टोल-फ्री)',
  },
// Knowledge & Preparedness Page
  'NDMA / SDMA Standard Operating Procedures (SOPs) & Preparedness': {
    hi: 'NDMA / SDMA मानक संचालन प्रक्रियाएँ (SOP) एवं आपदा तैयारी',
    mr: 'NDMA / SDMA मानक कार्यपद्धती (SOP) आणि आपत्ती पूर्वतयारी',
  },
'Standard Operating Procedure for Pre-Monsoon Western Ghats Landslide Red Zone Evacuation': {
    hi: 'मानसून-पूर्व पश्चिमी घाट भूस्खलन रेड-ज़ोन निकासी हेतु मानक संचालन प्रक्रिया (SOP)',
    mr: 'मान्सूनपूर्व पश्चिम घाट भूस्खलन रेड-झोन स्थलांतरासाठी मानक कार्यपद्धती (SOP)',
  },
'SPHERE & NDMA Carrying-Capacity Verification for Permanent Rehabilitation Host Sites': {
    hi: 'स्थायी पुनर्वास स्थलों की धारण-क्षमता सत्यापन हेतु SPHERE एवं NDMA मानक',
    mr: 'कायमस्वरूपी पुनर्वसन स्थळांच्या धारण-क्षमता पडताळणीसाठी SPHERE व NDMA मानके',
  },
'Savitri, Vashishti & Panchganga Basin Flash Flood & Dam Release Protocol': {
    hi: 'सावित्री, वशिष्ठी एवं पंचगंगा बेसिन बाढ़ एवं बाँध जल-विसर्जन प्रोटोकॉल',
    mr: 'सावित्री, वशिष्ठी व पंचगंगा खोरे पूर आणि धरण विसर्ग कार्यपद्धती',
  },
'Minimum Standards of Relief (MSR) in Emergency Shelters & Transit Camps': {
    hi: 'आपातकालीन आश्रय एवं राहत शिविरों में न्यूनतम राहत मानक (MSR)',
    mr: 'आपत्कालीन निवारा व मदत शिबिरांमधील किमान मदत मानके (MSR)',
  },
// Analytics & Reports Page
  'Executive Analytics, District Risk Profiles & Situation Reports (SitRep)': {
    hi: 'कार्यकारी विश्लेषण, जिला जोखिम प्रोफ़ाइल एवं स्थिति रिपोर्ट (SitRep)',
    mr: 'विश्लेषण, जिल्हा जोखीम प्रोफाईल आणि सद्यस्थिती अहवाल (SitRep)',
  },
'Download Official SEOC SitRep PDF': {
    hi: 'आधिकारिक SEOC स्थिति रिपोर्ट (SitRep PDF) डाउनलोड करें',
    mr: 'अधिकृत SEOC सद्यस्थिती अहवाल (SitRep PDF) डाउनलोड करा',
  },
// Settings Page
  'Administration, Threshold Calibration & Role Access Matrix': {
    hi: 'प्रशासन, थ्रेशोल्ड अंशांकन एवं भूमिका अधिकार मैट्रिक्स',
    mr: 'प्रशासन, थ्रेशोल्ड समायोजन आणि भूमिका अधिकार मॅट्रिक्स',
  },
'Administration, Data-Source Health, RBAC & Immutable Audit Log': {
    hi: 'प्रशासन, डेटा-स्रोत स्वास्थ्य, RBAC एवं अपरिवर्तनीय ऑडिट लॉग',
    mr: 'प्रशासन, डेटा-स्रोत स्थिती, RBAC आणि अपरिवर्तनीय ऑडिट लॉग',
  },
'Configure command center preferences, monitor national GIS and live telemetry connectors, inspect scoring formulas, and review the administrative audit trail.': {
    hi: 'कमांड सेंटर प्राथमिकताएँ कॉन्फ़िगर करें, राष्ट्रीय GIS एवं लाइव टेलीमेट्री कनेक्टर की निगरानी करें, स्कोरिंग सूत्र देखें और प्रशासनिक ऑडिट लॉग की समीक्षा करें।',
    mr: 'नियंत्रण कक्ष प्राधान्ये सेट करा, राष्ट्रीय GIS व थेट टेलीमेट्री कनेक्टर्स तपासा, स्कोअरिंग सूत्रे पहा आणि प्रशासकीय ऑडिट लॉगचा आढावा घ्या.',
  },
'Display, Accessibility & Localization': {
    hi: 'प्रदर्शन, सुगम्यता एवं भाषा स्थानीयकरण',
    mr: 'प्रदर्शन, सुलभता आणि भाषा स्थानिकीकरण',
  },
'Interface Language (i18n)': {
    hi: 'इंटरफ़ेस भाषा (i18n)',
    mr: 'इंटरफेस भाषा (i18n)',
  },
'Multilingual dictionary (English / हिन्दी / मराठी)': {
    hi: 'बहुभाषी शब्दकोश (English / हिन्दी / मराठी)',
    mr: 'बहुभाषिक शब्दकोश (English / हिन्दी / मराठी)',
  },
'Color Theme Mode': {
    hi: 'रंग थीम मोड',
    mr: 'रंग थीम मोड',
  },
'Switch to Light Mode': {
    hi: 'लाइट मोड में बदलें',
    mr: 'लाईट मोडवर जा',
  },
'Switch to Dark Mode': {
    hi: 'डार्क मोड में बदलें',
    mr: 'डार्क मोडवर जा',
  },
'Active Hazard Formula Weights & Thresholds': {
    hi: 'सक्रिय आपदा सूत्र भार (Weights) एवं थ्रेशोल्ड',
    mr: 'सक्रिय आपत्ती सूत्र भार (Weights) आणि थ्रेशोल्ड',
  },
'Restore Default (35/30/20/15)': {
    hi: 'डिफ़ॉल्ट रीसेट करें (35/30/20/15)',
    mr: 'डिफॉल्ट पूर्ववत करा (35/30/20/15)',
  },
// About Page
  'System Architecture, Methodology & Spatial Data Governance': {
    hi: 'सिस्टम आर्किटेक्चर, कार्यप्रणाली एवं स्थानिक डेटा गवर्नेंस',
    mr: 'प्रणाली रचना (Architecture), कार्यपद्धती आणि स्थानिक डेटा प्रशासन',
  },
'NDMA · SDMA · DDMA National Command & Relocation Platform': {
    hi: 'NDMA · SDMA · DDMA राष्ट्रीय कमांड एवं पुनर्वास प्लेटफॉर्म',
    mr: 'NDMA · SDMA · DDMA राष्ट्रीय नियंत्रण व पुनर्वसन प्रणाली',
  },
'Nivaran — National Disaster Risk, Red Zone & Relocation Management System': {
    hi: 'निवारण — राष्ट्रीय आपदा जोखिम, रेड-ज़ोन एवं पुनर्वास प्रबंधन प्रणाली',
    mr: 'निवारण — राष्ट्रीय आपत्ती जोखीम, रेड-झोन व पुनर्वसन व्यवस्थापन प्रणाली',
  },
'1. Data Ingestion': {
    hi: '1. डेटा एकीकरण (Data Ingestion)',
    mr: '1. डेटा संकलन (Data Ingestion)',
  },
'2. PostgreSQL + PostGIS': {
    hi: '2. स्थानिक डेटाबेस (Spatial Database)',
    mr: '2. स्थानिक डेटाबेस (Spatial Database)',
  },
'3. Spatial Analysis Engine': {
    hi: '3. स्थानिक विश्लेषण इंजन',
    mr: '3. स्थानिक विश्लेषण प्रणाली',
  },
'4. REST / GeoJSON API': {
    hi: '4. REST / GeoJSON सेवा गेटवे',
    mr: '4. REST / GeoJSON सेवा गेटवे',
  },
'5. Web & Field Apps': {
    hi: '5. वेब एवं फील्ड ऐप्स (PWA)',
    mr: '5. वेब आणि क्षेत्रीय अ‍ॅप्स (PWA)',
  },
// 3-Zone Login Page & Multi-Organisation Access
  'National Disaster Risk, Red Zone & Relocation Management System': {
    hi: 'राष्ट्रीय आपदा जोखिम, रेड-ज़ोन एवं पुनर्वास प्रबंधन प्रणाली',
    mr: 'राष्ट्रीय आपत्ती जोखीम, रेड-झोन व पुनर्वसन व्यवस्थापन प्रणाली',
  },
'Move people before the disaster, not after.': {
    hi: 'आपदा के बाद नहीं, आपदा से पहले सुरक्षित विस्थापन।',
    mr: 'आपत्तीनंतर नव्हे, आपत्तीपूर्वीच सुरक्षित स्थलांतर.',
  },
'Emergency SOS & Life-Safety': {
    hi: 'आपातकालीन SOS एवं जीवन-रक्षा',
    mr: 'आपत्कालीन SOS व जीवन-सुरक्षा',
  },
'Call 112 Directly': {
    hi: 'सीधे 112 पर कॉल करें',
    mr: 'थेट 112 वर कॉल करा',
  },
'Public Alerts & Advisories': {
    hi: 'सार्वजनिक अलर्ट एवं परामर्श',
    mr: 'सार्वजनिक इशारे व सूचना',
  },
'Alerts Near Me': {
    hi: 'मेरे आस-पास के अलर्ट',
    mr: 'माझ्या जवळील इशारे',
  },
'Use My Location': {
    hi: 'मेरी लोकेशन का उपयोग करें',
    mr: 'माझे स्थान वापरा',
  },
'Emergency Helplines': {
    hi: 'आपातकालीन हेल्पलाइन नंबर',
    mr: 'आपत्कालीन हेल्पलाइन क्रमांक',
  },
'Report a Hazard (No Login Required)': {
    hi: 'आपदा / खतरा रिपोर्ट करें (लॉगिन आवश्यक नहीं)',
    mr: 'आपत्ती / धोका नोंदवा (लॉगिन आवश्यक नाही)',
  },
'Submit Public Hazard Report': {
    hi: 'सार्वजनिक आपदा रिपोर्ट जमा करें',
    mr: 'सार्वजनिक आपत्ती अहवाल सादर करा',
  },
'Organisation & Authority Sign-In': {
    hi: 'संगठन एवं प्राधिकरण साइन-इन',
    mr: 'संस्था आणि प्राधिकरण साइन-इन',
  },
'Continue with Unified Government SSO': {
    hi: 'एकीकृत सरकारी SSO (मेरी पहचान / जन परिचय) से जारी रखें',
    mr: 'एकत्रित शासकीय SSO (मेरी पहचान / जन परिचय) द्वारे सुरू ठेवा',
  },
'Authorised use only. Activity is logged.': {
    hi: 'केवल अधिकृत उपयोग हेतु। सभी गतिविधियाँ लॉग की जाती हैं।',
    mr: 'केवळ अधिकृत वापरासाठी. सर्व कृतींची नोंद ठेवली जाते.',
  },
'3D Terrain & GIS Workspace': {
    hi: '3D भू-भाग एवं GIS कार्यक्षेत्र',
    mr: '3D भूप्रदेश आणि GIS कार्यक्षेत्र',
  },
'Evacuation Planning': {
    hi: 'निकासी एवं मार्ग योजना',
    mr: 'स्थलांतर व मार्ग नियोजन',
  },
'Damage Assessment': {
    hi: 'क्षति एवं राहत आवश्यकता आकलन',
    mr: 'नुकसान व मदत गरज पंचनामा',
  },
'Data Management': {
    hi: 'स्थानिक डेटा प्रबंधन',
    mr: 'स्थानिक डेटा व्यवस्थापन',
  },
'Command Search': {
    hi: 'कमांड खोज',
    mr: 'कमांड शोध',
  },
'Wall-Screen Display': {
    hi: 'वॉल-स्क्रीन कमांड डिस्प्ले',
    mr: 'वॉल-स्क्रीन कमांड डिस्प्ले',
  },
'Flood Inundation Simulator': {
    hi: 'बाढ़ जलभराव सिम्युलेटर (0–15 m)',
    mr: 'पूर जलपातळी सिम्युलेटर (0–15 m)',
  },
'Slope & Line-of-Sight Profile': {
    hi: 'ढलान एवं दृष्टि-रेखा (LOS) प्रोफ़ाइल',
    mr: 'उतार आणि दृष्टी-रेषा (LOS) प्रोफाइल',
  },
'3D Candidate Site Orbit View': {
    hi: '3D पुनर्वास स्थल ऑर्बिट दृश्य',
    mr: '3D पुनर्वसन स्थळ ऑर्बिट दृश्य',
  },
'Emergency SOS': {
    hi: 'आपातकालीन SOS',
    mr: 'आपत्कालीन SOS',
  },
'Voice Alert': {
    hi: 'ध्वनि चेतावनी (Voice Alert)',
    mr: 'ध्वनी इशारा (Voice Alert)',
  },
'Stop Voice Alert': {
    hi: 'ध्वनि चेतावनी रोकें',
    mr: 'ध्वनी इशारा थांबवा',
  },
'Stop Voice': {
    hi: 'ध्वनि रोकें',
    mr: 'ध्वनी थांबवा',
  },
'Voice Alert Broadcast': {
    hi: 'बहुभाषी ध्वनि चेतावनी प्रसारण',
    mr: 'बहुभाषिक ध्वनी इशारा प्रसारण',
  },
'Play Voice Alert': {
    hi: 'ध्वनि चेतावनी सुनें',
    mr: 'ध्वनी इशारा ऐका',
  },
'Sign In to Nivaran': {
    hi: 'निवारण में साइन इन करें',
    mr: 'निवारणमध्ये साइन इन करा',
  },
'Select your role, verify CAPTCHA, and access the operations workspace.': {
    hi: 'अपनी भूमिका चुनें, CAPTCHA सत्यापित करें और ऑपरेशंस वर्कस्पेस में प्रवेश करें।',
    mr: 'आपली भूमिका निवडा, CAPTCHA पडताळणी करा आणि ऑपरेशन्स वर्कस्पेसमध्ये प्रवेश करा.',
  },
'Organisation / Operational Role': {
    hi: 'संगठन / संचालन भूमिका',
    mr: 'संस्था / कार्यान्वयन भूमिका',
  },
'Security CAPTCHA Verification': {
    hi: 'सुरक्षा CAPTCHA सत्यापन',
    mr: 'सुरक्षा CAPTCHA पडताळणी',
  },
'New Code': {
    hi: 'नया कोड',
    mr: 'नवीन कोड',
  },
'Signing in...': {
    hi: 'साइन इन हो रहा है...',
    mr: 'साइन इन होत आहे...',
  },
'All 20 Modules Active': {
    hi: 'सभी 20 मॉड्यूल सक्रिय',
    mr: 'सर्व 20 मॉड्यूल्स सक्रिय',
  },
'Offline Ready': {
    hi: 'ऑफ़लाइन तैयार',
    mr: 'ऑफलाईन सज्ज',
  },
'SEND NOW': {
    hi: 'अभी भेजें',
    mr: 'आता पाठवा',
  },
'Ask Nivaran': {
    hi: 'निवारण सहायक',
    mr: 'निवारण सहाय्यक',
  },
  'Free Open GIS (Zero Key)': {
    hi: 'निःशुल्क ओपन जीआईएस (शून्य कुंजी)',
    mr: 'विनामूल्य ओपन जीआयएस (शून्य की)',
  },
  'API Key': {
    hi: 'एपीआई कुंजी',
    mr: 'एपीआय की',
  },
  'Map Provider & API Key Settings': {
    hi: 'मानचित्र प्रदाता एवं एपीआई कुंजी सेटिंग्स',
    mr: 'नकाशा प्रदाता आणि एपीआय की सेटिंग्ज',
  },
  '100% Free Open GIS active · Zero API key required': {
    hi: '100% निःशुल्क ओपन जीआईएस सक्रिय · शून्य एपीआई कुंजी आवश्यक',
    mr: '१००% मोफत ओपन जीआयएस सक्रिय · शून्य एपीआय की आवश्यक',
  },
  'Live Open GIS · 100% Free · Zero API Key Required': {
    hi: 'लाइव ओपन जीआईएस · 100% निःशुल्क · शून्य एपीआई कुंजी आवश्यक',
    mr: 'थेट ओपन जीआयएस · १००% विनामूल्य · शून्य एपीआय की आवश्यक',
  },
  'OpenStreetMap Live GPS (100% Free · Zero API Key Required)': {
    hi: 'ओपनस्ट्रीटमैप लाइव जीपीएस (100% निःशुल्क · शून्य एपीआई कुंजी आवश्यक)',
    mr: 'ओपनस्ट्रीटनकाशा थेट जीपीएस (१००% मोफत · शून्य एपीआय की आवश्यक)',
  },
  'Apply & Save Settings': {
    hi: 'लागू करें और सहेजें',
    mr: 'लागू करा आणि जतन करा',
  },
  'Reset to Free Open GIS': {
    hi: 'निःशुल्क ओपन जीआईएस पर रीसेट करें',
    mr: 'विनामूल्य ओपन जीआयएस वर रीसेट करा',
  },
  'Test Connection': {
    hi: 'कनेक्शन टेस्ट करें',
    mr: 'कनेक्शन तपासा',
  },
  '1. Live Open GIS Street Map (Live GPS & All Locations)': {
    hi: '1. लाइव ओपन जीआईएस सड़क मानचित्र (लाइव जीपीएस और सभी स्थान)',
    mr: '1. थेट ओपन जीआयएस रस्ता नकाशा (थेट जीपीएस आणि सर्व ठिकाणे)',
  },
  'Live Open GIS Street Map (2D)': {
    hi: 'लाइव ओपन जीआईएस सड़क मानचित्र (2D)',
    mr: 'थेट ओपन जीआयएस रस्ता नकाशा (2D)',
  },
  'Live Open GIS Street Map — Live GPS & All Locations': {
    hi: 'लाइव ओपन जीआईएस सड़क मानचित्र — लाइव जीपीएस और सभी स्थान',
    mr: 'थेट ओपन जीआयएस रस्ता नकाशा — थेट जीपीएस आणि सर्व ठिकाणे',
  },
  'Current Address (In Words)': {
    hi: 'वर्तमान पता (शब्दों में)',
    mr: 'सध्याचा पत्ता (शब्दांत)',
  },
  'Location (In Words):': {
    hi: 'स्थान (शब्दों में):',
    mr: 'स्थान (शब्दांत):',
  },
  'Locate Live GPS': {
    hi: 'लाइव जीपीएस स्थान खोजें',
    mr: 'थेट जीपीएस स्थान शोधा',
  },
  'Place pin manually': {
    hi: 'पिन मैन्युअल रखें',
    mr: 'पिन मॅन्युअली ठेवा',
  },
};

// Build dynamic entity dictionaries from mockData
const VILLAGE_MAP: Record<string, { hi: string; mr: string }> = {};
INITIAL_VILLAGES.forEach((v) => {
  VILLAGE_MAP[v.name] = { hi: v.nameHi, mr: v.nameMr };
});

const SITE_MAP: Record<string, { hi: string; mr: string }> = {};
INITIAL_RELOCATION_SITES.forEach((s) => {
  SITE_MAP[s.name] = { hi: s.nameHi, mr: s.nameMr };
});

const INTERVENTION_MAP: Record<string, { hi: string; mr: string }> = {};
INTERVENTION_OPTIONS.forEach((i) => {
  INTERVENTION_MAP[i.name] = { hi: i.nameHi, mr: i.nameMr };
});

const DISTRICT_MAP: Record<string, { hi: string; mr: string }> = {
  Raigad: { hi: 'रायगड', mr: 'रायगड' },
  Satara: { hi: 'सातारा', mr: 'सातारा' },
  Pune: { hi: 'पुणे', mr: 'पुणे' },
  Ratnagiri: { hi: 'रत्नागिरी', mr: 'रत्नागिरी' },
  Kolhapur: { hi: 'कोल्हापुर', mr: 'कोल्हापूर' },
  Sindhudurg: { hi: 'सिंधुदुर्ग', mr: 'सिंधुदुर्ग' },
  Khalapur: { hi: 'खालापुर', mr: 'खालापूर' },
  Mahad: { hi: 'महाड', mr: 'महाड' },
  Poladpur: { hi: 'पोलादपुर', mr: 'पोलादपूर' },
  Ambegaon: { hi: 'आंबेगाव', mr: 'आंबेगाव' },
  Maval: { hi: 'मावल', mr: 'मावळ' },
  Mulshi: { hi: 'मुलशी', mr: 'मुळशी' },
  Velhe: { hi: 'वेल्हे', mr: 'वेल्हे' },
  Bhor: { hi: 'भोर', mr: 'भोर' },
  Patan: { hi: 'पाटण', mr: 'पाटण' },
  Mahabaleshwar: { hi: 'महाबलेश्वर', mr: 'महाबळेश्वर' },
  Jawali: { hi: 'जावली', mr: 'जावळी' },
  Chiplun: { hi: 'चिपलून', mr: 'चिपळूण' },
  Khed: { hi: 'खेड', mr: 'खेड' },
  Sangameshwar: { hi: 'संगमेश्वर', mr: 'संगमेश्वर' },
  Dapoli: { hi: 'दापोली', mr: 'दापोली' },
  Shahuwadi: { hi: 'शाहूवाडी', mr: 'शाहूवाडी' },
  Panhala: { hi: 'पन्हाला', mr: 'पन्हाळा' },
  Radhanagari: { hi: 'राधानगरी', mr: 'राधानगरी' },
  Karveer: { hi: 'करवीर', mr: 'करवीर' },
};

const WORD_OR_TOKEN_REPLACEMENTS: Array<{
  en: string;
  hi: string;
  mr: string;
}> = [
  // Multi-word UI terms (ordered longest-first)
  {
    en: 'Additional Site Acquisition Required',
    hi: 'अतिरिक्त पुनर्वास भूमि अधिग्रहण आवश्यक',
    mr: 'अतिरिक्त पुनर्वसन जागा संपादन आवश्यक',
  },
  {
    en: 'In-Situ Monitoring (No Relocation Required)',
    hi: 'स्थानीय निगरानी (पुनर्वास आवश्यक नहीं)',
    mr: 'स्थानिक निरीक्षण (स्थलांतराची गरज नाही)',
  },
  {
    en: 'All Blocks / Tehsils',
    hi: 'सभी ब्लॉक / तहसील',
    mr: 'सर्व तालुके / ब्लॉक',
  },
  {
    en: 'Emergency Shelters & Relief Camps',
    hi: 'आपातकालीन आश्रय एवं राहत शिविर',
    mr: 'आपत्कालीन निवारा व मदत शिबिरे',
  },
  {
    en: 'NDRF / SDRF / Fire / Medical Units',
    hi: 'NDRF / SDRF / अग्निशमन / मेडिकल दल',
    mr: 'NDRF / SDRF / अग्निशमन / वैद्यकीय पथके',
  },
  {
    en: 'Relief Equipment & Stockpile',
    hi: 'राहत उपकरण एवं सामग्री भंडार',
    mr: 'बचाव उपकरणे व मदत साठा',
  },
  {
    en: 'Host Relocation Sites',
    hi: 'पुनर्वास मेजबान स्थल',
    mr: 'पुनर्वसन यजमान स्थळे',
  },
  {
    en: 'Habitations & Red Zones',
    hi: 'बस्तियाँ एवं रेड-ज़ोन',
    mr: 'वस्त्या आणि रेड-झोन',
  },
  {
    en: 'Official Decision Record PDF',
    hi: 'आधिकारिक निर्णय रिकॉर्ड PDF',
    mr: 'अधिकृत निर्णय अहवाल PDF',
  },
  {
    en: 'Multi-Hazard Score Breakdown',
    hi: 'बहु-आपदा स्कोर विश्लेषण',
    mr: 'बहु-आपत्ती स्कोअर विश्लेषण',
  },
  {
    en: 'Socio-Economic Vulnerability Breakdown',
    hi: 'सामाजिक-आर्थिक संवेदनशीलता विश्लेषण',
    mr: 'सामाजिक-आर्थिक संवेदनशीलता विश्लेषण',
  },
  {
    en: 'MCDA Site Suitability & Capacity',
    hi: 'MCDA स्थल उपयुक्तता एवं क्षमता',
    mr: 'MCDA जागा योग्यता व क्षमता',
  },
  {
    en: 'Monsoon Rainfall Intensity',
    hi: 'मानसून वर्षा तीव्रता',
    mr: 'मान्सून पर्जन्यमान तीव्रता',
  },
  {
    en: 'Terrain Slope Gradient',
    hi: 'भू-भाग ढलान कोण (Slope)',
    mr: 'भूप्रदेश उतार (Slope)',
  },
  {
    en: 'Past Disaster & Crack Reports',
    hi: 'पूर्व आपदा इतिहास एवं दरार रिपोर्ट',
    mr: 'मागील आपत्ती इतिहास व भेगांचे अहवाल',
  },
  {
    en: 'River / Scarp Proximity',
    hi: 'नदी / कगार से निकटता',
    mr: 'नदी / कड्याजवळील अंतर',
  },
  {
    en: 'Water Reliability',
    hi: 'पेयजल उपलब्धता एवं विश्वसनीयता',
    mr: 'पाणी पुरवठा विश्वासार्हता',
  },
  {
    en: 'Usable Land Area',
    hi: 'उपयोगी भूमि क्षेत्रफल',
    mr: 'वापरायोग्य जमीन क्षेत्रफळ',
  },
  {
    en: 'Distance from Hazard Zone',
    hi: 'आपदा क्षेत्र से सुरक्षित दूरी',
    mr: 'धोका क्षेत्रापासून सुरक्षित अंतर',
  },
  {
    en: 'All-Weather Road Access',
    hi: 'बारहमासी पक्की सड़क संपर्क',
    mr: 'बारमाही पक्का रस्ता संपर्क',
  },
  {
    en: 'Healthcare Access',
    hi: 'चिकित्सा एवं अस्पताल पहुँच',
    mr: 'आरोग्य व रुग्णालय संपर्क',
  },
  {
    en: 'School Proximity',
    hi: 'विद्यालय से निकटता',
    mr: 'शाळेपासूनचे अंतर',
  },
  {
    en: 'Engineering fix',
    hi: 'इंजीनियरिंग सुधार',
    mr: 'अभियांत्रिकी उपाय',
  },
  {
    en: 'Low concern',
    hi: 'कम जोखिम',
    mr: 'कमी धोका',
  },
  {
    en: 'Response Assigned',
    hi: 'बचाव दल नियुक्त',
    mr: 'बचाव पथक नियुक्त',
  },
  {
    en: 'In Progress',
    hi: 'कार्य प्रगति पर',
    mr: 'कार्य सुरू आहे',
  },
  {
    en: 'Compensation Paid',
    hi: 'मुआवजा भुगतान पूर्ण',
    mr: 'नुकसानभरपाई अदा',
  },
  {
    en: 'Site Allotted',
    hi: 'भूखंड आवंटित',
    mr: 'भूखंड वाटप पूर्ण',
  },
  {
    en: 'Government Revenue',
    hi: 'सरकारी राजस्व भूमि',
    mr: 'शासकीय महसूल जमीन',
  },
  {
    en: 'MIDC Surplus',
    hi: 'MIDC अधिशेष भूमि',
    mr: 'MIDC अतिरिक्त जमीन',
  },
  {
    en: 'Gram Panchayat',
    hi: 'ग्राम पंचायत',
    mr: 'ग्रामपंचायत',
  },
  {
    en: 'Pre-Configured Role Accounts',
    hi: 'पूर्व-कॉन्फ़िगर रोल खाते',
    mr: 'पूर्व-निश्चित भूमिका खाती',
  },
  {
    en: 'Remaining Safe Capacity:',
    hi: 'शेष सुरक्षित क्षमता:',
    mr: 'उर्वरित सुरक्षित क्षमता:',
  },
  {
    en: 'Safe Capacity:',
    hi: 'सुरक्षित क्षमता:',
    mr: 'सुरक्षित क्षमता:',
  },
  {
    en: 'Hazard Re-check:',
    hi: 'आपदा पुनर्जाँच:',
    mr: 'आपत्ती फेरतपासणी:',
  },
  {
    en: 'Nearest Safe Shelter:',
    hi: 'निकटतम सुरक्षित आश्रय:',
    mr: 'जवळचे सुरक्षित निवारा केंद्र:',
  },
  {
    en: 'Occupancy:',
    hi: 'उपस्थिति (Occupancy):',
    mr: 'उपस्थिती (Occupancy):',
  },
  {
    en: 'Incharge:',
    hi: 'प्रभारी:',
    mr: 'प्रभारी:',
  },
  {
    en: 'Households:',
    hi: 'परिवार:',
    mr: 'कुटुंबे:',
  },
  {
    en: 'Slope:',
    hi: 'ढलान:',
    mr: 'उतार:',
  },
  {
    en: 'Rain:',
    hi: 'वर्षा:',
    mr: 'पाऊस:',
  },
  {
    en: 'Status:',
    hi: 'स्थिति:',
    mr: 'स्थिती:',
  },
  {
    en: 'Host:',
    hi: 'पुनर्वास स्थल:',
    mr: 'पुनर्वसन स्थळ:',
  },
  {
    en: 'Channels:',
    hi: 'प्रसारण माध्यम:',
    mr: 'प्रसारण माध्यमे:',
  },
  {
    en: 'Primary Hazard:',
    hi: 'मुख्य आपदा:',
    mr: 'मुख्य आपत्ती:',
  },
  {
    en: 'Inspect Site',
    hi: 'स्थल निरीक्षण करें',
    mr: 'जागा तपासा',
  },
  {
    en: 'Block',
    hi: 'तालुका',
    mr: 'तालुका',
  },
  {
    en: 'Taluka',
    hi: 'तालुका',
    mr: 'तालुका',
  },
  {
    en: 'District',
    hi: 'जिला',
    mr: 'जिल्हा',
  },
  {
    en: 'households',
    hi: 'परिवार',
    mr: 'कुटुंबे',
  },
  {
    en: 'Households',
    hi: 'परिवार',
    mr: 'कुटुंबे',
  },
  {
    en: 'Population',
    hi: 'जनसंख्या',
    mr: 'लोकसंख्या',
  },
  {
    en: 'families',
    hi: 'परिवार',
    mr: 'कुटुंबे',
  },
  {
    en: 'villages',
    hi: 'गाँव',
    mr: 'गावे',
  },
  {
    en: 'Village',
    hi: 'गाँव',
    mr: 'गाव',
  },
  {
    en: 'persons',
    hi: 'व्यक्ति',
    mr: 'व्यक्ती',
  },
  {
    en: 'citizens',
    hi: 'नागरिक',
    mr: 'नागरिक',
  },
  {
    en: 'Verified',
    hi: 'सत्यापित',
    mr: 'पडताळणी पूर्ण',
  },
  {
    en: 'Reported',
    hi: 'दर्ज किया गया',
    mr: 'नोंदवलेले',
  },
  {
    en: 'Resolved',
    hi: 'समाधान पूर्ण',
    mr: 'निराकरण पूर्ण',
  },
  {
    en: 'Identified',
    hi: 'चिन्हित',
    mr: 'ओळखलेले',
  },
  {
    en: 'Approved',
    hi: 'स्वीकृत',
    mr: 'मंजूर',
  },
  {
    en: 'Resettled',
    hi: 'पुनर्वासित',
    mr: 'पुनर्वसित',
  },
  {
    en: 'Available',
    hi: 'उपलब्ध',
    mr: 'उपलब्ध',
  },
  {
    en: 'Deployed',
    hi: 'तैनात',
    mr: 'तैनात',
  },
  {
    en: 'Standby',
    hi: 'स्टैंडबाय',
    mr: 'राखीव (Standby)',
  },
  {
    en: 'Relocate',
    hi: 'पुनर्वास करें',
    mr: 'स्थलांतर करा',
  },
  {
    en: 'Monitor',
    hi: 'निगरानी रखें',
    mr: 'निरीक्षण करा',
  },
  {
    en: 'Critical',
    hi: 'अति-गंभीर',
    mr: 'अति-गंभीर',
  },
  {
    en: 'High',
    hi: 'उच्च',
    mr: 'उच्च',
  },
  {
    en: 'Moderate',
    hi: 'मध्यम',
    mr: 'मध्यम',
  },
  {
    en: 'LANDSLIDE',
    hi: 'भूस्खलन',
    mr: 'भूस्खलन',
  },
  {
    en: 'FLOOD',
    hi: 'बाढ़',
    mr: 'पूर',
  },
  {
    en: 'CLOUDBURST',
    hi: 'बादल फटना',
    mr: 'ढगफुटी',
  },
  {
    en: 'EROSION',
    hi: 'कटाव / भू-क्षरण',
    mr: 'धूप / भू-क्षरण',
  },
  {
    en: 'landslide',
    hi: 'भूस्खलन',
    mr: 'भूस्खलन',
  },
  {
    en: 'flood',
    hi: 'बाढ़',
    mr: 'पूर',
  },
  {
    en: 'cloudburst',
    hi: 'बादल फटना',
    mr: 'ढगफुटी',
  },
  {
    en: 'erosion',
    hi: 'भू-क्षरण',
    mr: 'धूप',
  },
];

// Also map Relief Camp names nicely
INITIAL_RELIEF_CAMPS.forEach((c) => {
  if (!EXACT_PHRASES[c.name]) {
    const hiName = c.name
      .replace('High School', 'हाई स्कूल')
      .replace('Multipurpose Cyclone Shelter', 'बहुउद्देशीय तूफान आश्रय केंद्र')
      .replace('Sports Complex', 'क्रीड़ा संकुल')
      .replace('Community Hall', 'सामुदायिक भवन')
      .replace('Z.P. Primary School', 'जिला परिषद प्राथमिक विद्यालय')
      .replace('Polytechnic Campus', 'पॉलिटेक्निक परिसर')
      .replace('Relief Camp', 'राहत शिविर')
      .replace('Market Yard Shed', 'मार्केट यार्ड आश्रय शेड')
      .replace('Gram Panchayat Bhavan', 'ग्राम पंचायत भवन')
      .replace('MIDC Auditorium', 'MIDC सभागृह');
    const mrName = c.name
      .replace('High School', 'हायस्कूल')
      .replace('Multipurpose Cyclone Shelter', 'बहुउद्देशीय चक्रीवादळ निवारा केंद्र')
      .replace('Sports Complex', 'क्रीडा संकुल')
      .replace('Community Hall', 'सामाजिक सभागृह')
      .replace('Z.P. Primary School', 'जि.प. प्राथमिक शाळा')
      .replace('Polytechnic Campus', 'पॉलिटेक्निक परिसर')
      .replace('Relief Camp', 'मदत शिबिर')
      .replace('Market Yard Shed', 'मार्केट यार्ड निवारा शेड')
      .replace('Gram Panchayat Bhavan', 'ग्रामपंचायत भवन')
      .replace('MIDC Auditorium', 'MIDC सभागृह');
    SITE_MAP[c.name] = { hi: hiName, mr: mrName };
  }
});

// Common word-level dictionary for general headings/labels not matched by exact phrases
const COMMON_WORDS: Array<{ re: RegExp; hi: string; mr: string }> = [
  { re: /\bDashboard\b/g, hi: 'डैशबोर्ड', mr: 'डॅशबोर्ड' },
  { re: /\bHabitations\b/g, hi: 'बस्तियाँ', mr: 'वस्त्या' },
  { re: /\bHabitation\b/g, hi: 'बस्ती', mr: 'वस्ती' },
  { re: /\bVillages\b/g, hi: 'गाँव', mr: 'गावे' },
  { re: /\bRelocation\b/g, hi: 'पुनर्वास', mr: 'पुनर्वसन' },
  { re: /\bEvacuation\b/g, hi: 'निकासी', mr: 'स्थलांतर' },
  { re: /\bShelters\b/g, hi: 'आश्रय केंद्र', mr: 'निवारा केंद्रे' },
  { re: /\bShelter\b/g, hi: 'आश्रय केंद्र', mr: 'निवारा केंद्र' },
  { re: /\bRelief Camps\b/g, hi: 'राहत शिविर', mr: 'मदत शिबिरे' },
  { re: /\bRelief Camp\b/g, hi: 'राहत शिविर', mr: 'मदत शिबिर' },
  { re: /\bIncidents\b/g, hi: 'घटनाएँ', mr: 'घटना' },
  { re: /\bIncident\b/g, hi: 'घटना', mr: 'घटना' },
  { re: /\bVulnerability\b/g, hi: 'संवेदनशीलता', mr: 'संवेदनशीलता' },
  { re: /\bHazard\b/g, hi: 'आपदा जोखिम', mr: 'आपत्ती धोका' },
  { re: /\bPriority\b/g, hi: 'प्राथमिकता', mr: 'प्राधान्य' },
  { re: /\bCapacity\b/g, hi: 'क्षमता', mr: 'क्षमता' },
  { re: /\bSuitability\b/g, hi: 'उपयुक्तता', mr: 'योग्यता' },
  { re: /\bDownload\b/g, hi: 'डाउनलोड', mr: 'डाउनलोड' },
  { re: /\bExport\b/g, hi: 'निर्यात', mr: 'निर्यात' },
  { re: /\bSearch\b/g, hi: 'खोजें', mr: 'शोधा' },
  { re: /\bFilter\b/g, hi: 'फ़िल्टर', mr: 'फिल्टर' },
  { re: /\bSummary\b/g, hi: 'सारांश', mr: 'सारांश' },
  { re: /\bDetails\b/g, hi: 'विवरण', mr: 'तपशील' },
  { re: /\bReport\b/g, hi: 'रिपोर्ट', mr: 'अहवाल' },
  { re: /\bReports\b/g, hi: 'रिपोर्ट्स', mr: 'अहवाल' },
  { re: /\bAlert\b/g, hi: 'चेतावनी', mr: 'इशारा' },
  { re: /\bAlerts\b/g, hi: 'चेतावनियाँ', mr: 'इशारे' },
  { re: /\bSensors\b/g, hi: 'सेंसर', mr: 'सेन्सर्स' },
  { re: /\bSensor\b/g, hi: 'सेंसर', mr: 'सेन्सर' },
  { re: /\bRainfall\b/g, hi: 'वर्षा', mr: 'पर्जन्यमान' },
  { re: /\bTemperature\b/g, hi: 'तापमान', mr: 'तापमान' },
  { re: /\bEmergency\b/g, hi: 'आपातकालीन', mr: 'आपत्कालीन' },
  { re: /\bOfficial\b/g, hi: 'आधिकारिक', mr: 'अधिकृत' },
  { re: /\bSubmit\b/g, hi: 'जमा करें', mr: 'सादर करा' },
  { re: /\bCancel\b/g, hi: 'रद्द करें', mr: 'रद्द करा' },
  { re: /\bClose\b/g, hi: 'बंद करें', mr: 'बंद करा' },
  { re: /\bSave\b/g, hi: 'सहेजें', mr: 'जतन करा' },
  { re: /\bActive\b/g, hi: 'सक्रिय', mr: 'सक्रिय' },
  { re: /\bPending\b/g, hi: 'लंबित', mr: 'प्रलंबित' },
  { re: /\bAll\b/g, hi: 'सभी', mr: 'सर्व' },
];

/**
 * Reverse lookup map from Hindi and Marathi text back to the canonical English base.
 */
const REVERSE_LOOKUP = new Map<string, string>();
const REVERSE_SORTED_PHRASES: [string, string][] = [];

// Populate REVERSE_LOOKUP from all dictionaries
for (const [en, loc] of Object.entries(EXACT_PHRASES)) {
  if (loc.hi && loc.hi !== en) REVERSE_LOOKUP.set(loc.hi, en);
  if (loc.mr && loc.mr !== en) REVERSE_LOOKUP.set(loc.mr, en);
}

for (const [en, loc] of Object.entries(VILLAGE_MAP)) {
  if (loc.hi) REVERSE_LOOKUP.set(loc.hi, en);
  if (loc.mr) REVERSE_LOOKUP.set(loc.mr, en);
}

for (const [en, loc] of Object.entries(SITE_MAP)) {
  if (loc.hi) REVERSE_LOOKUP.set(loc.hi, en);
  if (loc.mr) REVERSE_LOOKUP.set(loc.mr, en);
}

for (const [en, loc] of Object.entries(INTERVENTION_MAP)) {
  if (loc.hi) REVERSE_LOOKUP.set(loc.hi, en);
  if (loc.mr) REVERSE_LOOKUP.set(loc.mr, en);
}

for (const [en, loc] of Object.entries(DISTRICT_MAP)) {
  if (loc.hi) REVERSE_LOOKUP.set(loc.hi, en);
  if (loc.mr) REVERSE_LOOKUP.set(loc.mr, en);
}

for (const token of WORD_OR_TOKEN_REPLACEMENTS) {
  if (token.hi) REVERSE_LOOKUP.set(token.hi, token.en);
  if (token.mr) REVERSE_LOOKUP.set(token.mr, token.en);
}

for (const w of COMMON_WORDS) {
  const enWord = w.re.source.replace(/\\b/g, '');
  if (w.hi) REVERSE_LOOKUP.set(w.hi, enWord);
  if (w.mr) REVERSE_LOOKUP.set(w.mr, enWord);
}

// Build sorted reverse array for multi-token / substring resolution
for (const [nonEn, en] of REVERSE_LOOKUP.entries()) {
  if (nonEn.length >= 3) {
    REVERSE_SORTED_PHRASES.push([nonEn, en]);
  }
}
REVERSE_SORTED_PHRASES.sort((a, b) => b[0].length - a[0].length);

/**
 * Resolves a Hindi, Marathi, or mixed Devanagari string back to its canonical English base.
 */
export function resolveToEnglish(text: string): string {
  if (!text) return text;
  const trimmed = text.trim();
  if (!trimmed) return text;

  // 1. Direct match in reverse lookup
  const exact = REVERSE_LOOKUP.get(trimmed);
  if (exact) {
    const leadingSpace = text.match(/^\s*/)?.[0] ?? '';
    const trailingSpace = text.match(/\s*$/)?.[0] ?? '';
    return `${leadingSpace}${exact}${trailingSpace}`;
  }

  // 2. Substring replacements using longest non-English tokens first
  let result = trimmed;
  for (const [nonEn, en] of REVERSE_SORTED_PHRASES) {
    if (result.includes(nonEn)) {
      result = result.split(nonEn).join(en);
    }
  }

  const leadingSpace = text.match(/^\s*/)?.[0] ?? '';
  const trailingSpace = text.match(/\s*$/)?.[0] ?? '';
  return `${leadingSpace}${result}${trailingSpace}`;
}

/**
 * Translates an arbitrary English, Hindi, or Marathi UI string into the target language
 * ('en', 'hi', or 'mr') while preserving leading/trailing whitespace, numbers, and punctuation.
 */
export function translateTextToLanguage(rawText: string, lang: Language): string {
  if (!rawText) return rawText;

  const trimmed = rawText.trim();
  if (!trimmed) return rawText;

  // Skip pure numbers, coordinates, emails, URLs, codes
  if (
    /^[\d.,:%°+\-–—/()[\]#•|·\s]+$/.test(trimmed) ||
    trimmed.includes('@') ||
    trimmed.startsWith('http') ||
    trimmed.startsWith('0x')
  ) {
    return rawText;
  }

  // Skip language switcher labels themselves
  if (
    trimmed === 'English' ||
    trimmed === 'हिन्दी' ||
    trimmed === 'मराठी' ||
    trimmed === 'EN' ||
    trimmed === 'हिं' ||
    trimmed === 'मरा'
  ) {
    return rawText;
  }

  // If text already contains Devanagari characters, resolve it to canonical English base first
  let englishBase = trimmed;
  if (/[\u0900-\u097F]/.test(trimmed)) {
    englishBase = resolveToEnglish(trimmed).trim();
  }

  const leadingSpace = rawText.match(/^\s*/)?.[0] ?? '';
  const trailingSpace = rawText.match(/\s*$/)?.[0] ?? '';

  if (lang === 'en') {
    return `${leadingSpace}${englishBase}${trailingSpace}`;
  }

  // 1. Check exact phrase dictionary
  const exact = EXACT_PHRASES[englishBase];
  if (exact) {
    return `${leadingSpace}${exact[lang]}${trailingSpace}`;
  }

  // 2. Check exact village name, site name, intervention name, or district/taluka name
  if (VILLAGE_MAP[englishBase]) {
    return `${leadingSpace}${VILLAGE_MAP[englishBase][lang]}${trailingSpace}`;
  }
  if (SITE_MAP[englishBase]) {
    return `${leadingSpace}${SITE_MAP[englishBase][lang]}${trailingSpace}`;
  }
  if (INTERVENTION_MAP[englishBase]) {
    return `${leadingSpace}${INTERVENTION_MAP[englishBase][lang]}${trailingSpace}`;
  }
  if (DISTRICT_MAP[englishBase]) {
    return `${leadingSpace}${DISTRICT_MAP[englishBase][lang]}${trailingSpace}`;
  }

  // 3. Apply composite / token replacements (villages, sites, districts, and common UI labels)
  let result = englishBase;

  // Replace village names inside composite strings
  for (const [enName, loc] of Object.entries(VILLAGE_MAP)) {
    if (result.includes(enName)) {
      result = result.split(enName).join(loc[lang]);
    }
  }

  // Replace site & camp names inside composite strings
  for (const [enName, loc] of Object.entries(SITE_MAP)) {
    if (result.includes(enName)) {
      result = result.split(enName).join(loc[lang]);
    }
  }

  // Replace intervention names
  for (const [enName, loc] of Object.entries(INTERVENTION_MAP)) {
    if (result.includes(enName)) {
      result = result.split(enName).join(loc[lang]);
    }
  }

  // Replace district & taluka names
  for (const [enName, loc] of Object.entries(DISTRICT_MAP)) {
    if (result.includes(enName)) {
      result = result.replace(new RegExp(`\\b${enName}\\b`, 'g'), loc[lang]);
    }
  }

  // Replace exact phrases that appear as substrings
  for (const [enPhrase, loc] of Object.entries(EXACT_PHRASES)) {
    if (enPhrase.length > 5 && result.includes(enPhrase)) {
      result = result.split(enPhrase).join(loc[lang]);
    }
  }

  // Replace common UI tokens & suffixes
  for (const token of WORD_OR_TOKEN_REPLACEMENTS) {
    if (result.includes(token.en)) {
      result = result.split(token.en).join(lang === 'hi' ? token.hi : token.mr);
    }
  }

  // Replace common general UI words
  for (const w of COMMON_WORDS) {
    result = result.replace(w.re, lang === 'hi' ? w.hi : w.mr);
  }

  // Handle common abbreviations like "48 HH" -> "48 परिवार" / "48 कुटुंबे"
  result = result.replace(
    /\b(\d+)\s*HH\b/g,
    lang === 'hi' ? '$1 परिवार' : '$1 कुटुंबे'
  );
  result = result.replace(
    /\bIMD\s+Orange\b/g,
    lang === 'hi' ? 'IMD नारंगी' : 'IMD ऑरेंज'
  );
  result = result.replace(
    /\bIMD\s+Red\b/g,
    lang === 'hi' ? 'IMD लाल' : 'IMD रेड'
  );
  result = result.replace(
    /\bIMD\s+Yellow\b/g,
    lang === 'hi' ? 'IMD पीला' : 'IMD यलो'
  );
  result = result.replace(
    /\bIMD\s+Green\b/g,
    lang === 'hi' ? 'IMD हरा' : 'IMD ग्रीन'
  );

  return `${leadingSpace}${result}${trailingSpace}`;
}
